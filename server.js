#!/usr/bin/env node

/**
 * Bucket sync server — Yjs WebSocket relay with disk persistence.
 *
 * Each room gets its own Y.Doc. Persisted to DATA_DIR/<room>.yjs.
 * Idle rooms are evicted from memory after 10 minutes.
 *
 * Security:
 *   - Room ID validation (alphanumeric, 6–32 chars)
 *   - Per-IP connection limit (MAX_CONNS_PER_IP, default 5)
 *   - Connection rate limit (max 10 new conns/min per IP)
 *   - Global connection limit (MAX_CONNS, default 200)
 *
 * Reliability:
 *   - Debounced disk persistence (2s)
 *   - Daily backups to DATA_DIR/backups/
 *   - Graceful SIGTERM shutdown (flush all docs)
 *
 * Env:
 *   PORT              (default 8040)
 *   DATA_DIR          (default ./data)
 *   MAX_CONNS         (default 200)
 *   MAX_CONNS_PER_IP  (default 5)
 */

import { WebSocketServer } from "ws";
import http from "http";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import fs from "fs";
import path from "path";
import nacl from "tweetnacl";

const PORT = parseInt(process.env.PORT || "8040", 10);
const DATA_DIR = process.env.DATA_DIR || "./data";
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_CONNS = parseInt(process.env.MAX_CONNS || "200", 10);
const MAX_CONNS_PER_IP = parseInt(process.env.MAX_CONNS_PER_IP || "5", 10);
const IDLE_MS = 10 * 60 * 1000;
const PERSIST_MS = 2000;
const PING_MS = 30_000; // ping every 30s to keep connection alive through proxies

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// --- Per-IP rate limiting ---

const ipConns = new Map();      // ip -> Set<ws>
const ipRateWindow = new Map(); // ip -> [timestamps]
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;            // max 10 new conns per minute per IP

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  let timestamps = ipRateWindow.get(ip);
  if (!timestamps) {
    timestamps = [];
    ipRateWindow.set(ip, timestamps);
  }
  // Prune old entries
  while (timestamps.length && timestamps[0] < now - RATE_WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_MAX) return false;
  timestamps.push(now);
  return true;
}

function trackConn(ip, ws) {
  let set = ipConns.get(ip);
  if (!set) { set = new Set(); ipConns.set(ip, set); }
  set.add(ws);
}

function untrackConn(ip, ws) {
  const set = ipConns.get(ip);
  if (set) {
    set.delete(ws);
    if (set.size === 0) ipConns.delete(ip);
  }
}

function ipConnCount(ip) {
  return ipConns.get(ip)?.size || 0;
}

// --- Room state ---

const rooms = new Map();

function validateRoom(room) {
  return /^[a-z0-9]{6,32}$/i.test(room);
}

function recoverFromBackup(name, doc) {
  try {
    const dirs = fs.readdirSync(BACKUP_DIR)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .reverse();
    for (const dir of dirs) {
      const backupFile = path.join(BACKUP_DIR, dir, `${name}.yjs`);
      if (fs.existsSync(backupFile)) {
        try {
          Y.applyUpdate(doc, fs.readFileSync(backupFile));
          console.log(`✅ Recovered ${name} from backup ${dir}`);
          return true;
        } catch {
          continue; // this backup also corrupt, try older
        }
      }
    }
  } catch {}
  return false;
}

function getRoom(name) {
  let room = rooms.get(name);
  if (room) {
    room.lastAccess = Date.now();
    return room;
  }

  const doc = new Y.Doc();
  const file = path.join(DATA_DIR, `${name}.yjs`);

  if (fs.existsSync(file)) {
    try {
      Y.applyUpdate(doc, fs.readFileSync(file));
    } catch (e) {
      console.error(`⚠️ Corrupt data for ${name}, trying backup...`);
      if (!recoverFromBackup(name, doc)) {
        console.error(`⚠️ No backup for ${name}, starting fresh`);
      }
    }
  }

  let persistTimer = null;
  const persistNow = () => {
    try {
      const tmp = file + ".tmp";
      fs.writeFileSync(tmp, Y.encodeStateAsUpdate(doc));
      fs.renameSync(tmp, file); // atomic on POSIX
    } catch (e) {
      console.error(`⚠️ Write failed for ${name}:`, e.message);
    }
  };
  const persist = () => {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistNow, PERSIST_MS);
  };
  doc.on("update", persist);

  room = {
    doc,
    awareness: new awarenessProtocol.Awareness(doc),
    conns: new Set(),
    lastAccess: Date.now(),
    persistTimer,
    file,
    persist,
    persistNow,
  };
  rooms.set(name, room);
  console.log(`📂 Room ${name} (${rooms.size} active)`);
  return room;
}

function flushRoom(name) {
  const room = rooms.get(name);
  if (!room) return;
  clearTimeout(room.persistTimer);
  try {
    const tmp = room.file + ".tmp";
    fs.writeFileSync(tmp, Y.encodeStateAsUpdate(room.doc));
    fs.renameSync(tmp, room.file);
  } catch (e) {
    console.error(`⚠️ Flush failed for ${name}:`, e.message);
  }
}

function evictRoom(name) {
  const room = rooms.get(name);
  if (!room || room.conns.size > 0) return;
  flushRoom(name);
  room.doc.destroy();
  room.awareness.destroy();
  rooms.delete(name);
  console.log(`🗑️ Evicted ${name} (${rooms.size} active)`);
}

// Eviction sweep every minute
setInterval(() => {
  const now = Date.now();
  for (const [name, room] of rooms) {
    if (room.conns.size === 0 && now - room.lastAccess > IDLE_MS) {
      evictRoom(name);
    }
  }
}, 60_000);

// --- Daily backups ---

function runBackup() {
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dir = path.join(BACKUP_DIR, stamp);
  fs.mkdirSync(dir, { recursive: true });

  let count = 0;
  // Backup in-memory rooms
  for (const [name, room] of rooms) {
    try {
      fs.writeFileSync(path.join(dir, `${name}.yjs`), Y.encodeStateAsUpdate(room.doc));
      count++;
    } catch {}
  }
  // Backup on-disk rooms not in memory
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith(".yjs")) continue;
    const name = f.slice(0, -4);
    if (rooms.has(name)) continue; // already backed up
    try {
      fs.copyFileSync(path.join(DATA_DIR, f), path.join(dir, f));
      count++;
    } catch {}
  }

  // Prune backups older than 7 days
  for (const d of fs.readdirSync(BACKUP_DIR)) {
    const age = Date.now() - new Date(d).getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) {
      try { fs.rmSync(path.join(BACKUP_DIR, d), { recursive: true }); } catch {}
    }
  }

  console.log(`📦 Backup ${stamp}: ${count} rooms`);
}

// Run backup daily (check every hour, backup once per day)
let lastBackupDate = "";
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastBackupDate) {
    lastBackupDate = today;
    runBackup();
  }
}, 60 * 60 * 1000);
// Also backup on startup
setTimeout(runBackup, 5000);

// --- Message handling ---

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

function handleMessage(ws, room, data) {
  try {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const type = decoding.readVarUint(decoder);

    if (type === MSG_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
      if (encoding.length(encoder) > 1) {
        ws.send(encoding.toUint8Array(encoder));
      }
    } else if (type === MSG_AWARENESS) {
      const update = decoding.readVarUint8Array(decoder);
      awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
    }
  } catch (e) {
    console.error("Message error:", e.message);
  }
}

// --- Encryption helpers (mirrors client store.ts) ---

const ENC_FIELDS = new Set(["title", "description", "emoji"]);
const ENC_PREFIX = "\x01";

function toB64(bytes) {
  return Buffer.from(bytes).toString("base64url");
}
function fromB64(s) {
  return new Uint8Array(Buffer.from(s, "base64url"));
}

function encryptField(plain, keyBytes) {
  if (!keyBytes) return plain;
  const nonce = nacl.randomBytes(24);
  const msg = new TextEncoder().encode(plain);
  const box = nacl.secretbox(msg, nonce, keyBytes);
  const full = new Uint8Array(24 + box.length);
  full.set(nonce);
  full.set(box, 24);
  return ENC_PREFIX + toB64(full);
}

function decryptField(val, keyBytes) {
  if (!keyBytes || typeof val !== "string" || val[0] !== ENC_PREFIX) return val;
  try {
    const full = fromB64(val.slice(1));
    const nonce = full.slice(0, 24);
    const box = full.slice(24);
    const msg = nacl.secretbox.open(box, nonce, keyBytes);
    if (!msg) return val;
    return new TextDecoder().decode(msg);
  } catch {
    return val;
  }
}

function ymapToObj(ymap, keyBytes) {
  // Handle both Y.Map (nested CRDT) and plain objects (legacy)
  if (ymap instanceof Y.Map) {
    const obj = {};
    ymap.forEach((val, key) => {
      obj[key] = ENC_FIELDS.has(key) && typeof val === "string" ? decryptField(val, keyBytes) : val;
    });
    return obj;
  }
  if (ymap && typeof ymap === "object") {
    const obj = { ...ymap };
    for (const k of ENC_FIELDS) {
      if (typeof obj[k] === "string") obj[k] = decryptField(obj[k], keyBytes);
    }
    return obj;
  }
  return null;
}

function setEncFields(ymap, fields, keyBytes) {
  if (ymap instanceof Y.Map) {
    for (const [k, v] of Object.entries(fields)) {
      if (keyBytes && ENC_FIELDS.has(k)) {
        ymap.set(k, encryptField(String(v), keyBytes));
      } else {
        ymap.set(k, v);
      }
    }
  }
  // Plain objects: can't mutate in-place on a Y.Map parent — would need to replace the whole entry.
  // For PATCH on legacy data, convert to Y.Map first.
}

function parseEncKey(req) {
  const hdr = req.headers["x-enc-key"];
  if (!hdr) return null;
  try { return fromB64(hdr); } catch { return null; }
}

// --- REST API ---

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e5) reject(new Error("Too large")); });
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); } });
  });
}

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function handleRest(req, res) {
  const url = new URL(req.url, "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean); // ["room", roomId, "tasks"|"lists", taskId?]

  // CORS for skill/CLI usage
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Enc-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return true; }

  if (parts[0] !== "room" || !parts[1] || !validateRoom(parts[1])) return false;

  const roomName = parts[1];
  const resource = parts[2]; // "tasks" | "lists"
  const itemId = parts[3];
  const keyBytes = parseEncKey(req);

  // Load room (creates Y.Doc from disk if not in memory)
  const room = getRoom(roomName);

  const yLists = room.doc.getMap("lists");
  const yTasks = room.doc.getMap("tasks");

  try {
    // --- Lists ---
    if (resource === "lists") {
      if (req.method === "GET") {
        const out = [];
        yLists.forEach((val) => { const o = ymapToObj(val, keyBytes); if (o) out.push(o); });
        out.sort((a, b) => a.createdAt - b.createdAt);
        return json(res, 200, out);
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        const id = uid();
        const ymap = new Y.Map();
        room.doc.transact(() => {
          setEncFields(ymap, { id, title: body.title || "Untitled", emoji: body.emoji || "📋", createdAt: Date.now() }, keyBytes);
          yLists.set(id, ymap);
        });
        return json(res, 201, { id });
      }
      if (req.method === "PATCH" && itemId) {
        const ymap = yLists.get(itemId);
        if (!ymap) return json(res, 404, { error: "List not found" });
        const body = await readBody(req);
        const allowed = {};
        if (body.title !== undefined) allowed.title = body.title;
        if (body.emoji !== undefined) allowed.emoji = body.emoji;
        room.doc.transact(() => setEncFields(ymap, allowed, keyBytes));
        return json(res, 200, { ok: true });
      }
      if (req.method === "DELETE" && itemId) {
        room.doc.transact(() => {
          yTasks.forEach((_val, taskId) => {
            const tm = yTasks.get(taskId);
            if (tm instanceof Y.Map && tm.get("listId") === itemId) yTasks.delete(taskId);
          });
          yLists.delete(itemId);
        });
        return json(res, 200, { ok: true });
      }
    }

    // --- Tasks ---
    if (resource === "tasks") {
      if (req.method === "GET") {
        const listFilter = url.searchParams.get("list");
        const out = [];
        yTasks.forEach((val) => {
          const t = ymapToObj(val, keyBytes);
          if (t && (!listFilter || t.listId === listFilter)) out.push(t);
        });
        out.sort((a, b) => a.createdAt - b.createdAt);
        return json(res, 200, out);
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        if (!body.listId) return json(res, 400, { error: "listId required" });
        const id = uid();
        const ymap = new Y.Map();
        room.doc.transact(() => {
          setEncFields(ymap, {
            id, listId: body.listId,
            title: body.title || "Untitled",
            description: body.description || "",
            progress: body.progress ?? 0,
            createdAt: Date.now(),
          }, keyBytes);
          yTasks.set(id, ymap);
        });
        return json(res, 201, { id });
      }
      if (req.method === "PATCH" && itemId) {
        const ymap = yTasks.get(itemId);
        if (!ymap) return json(res, 404, { error: "Task not found" });
        const body = await readBody(req);
        const allowed = {};
        for (const k of ["title", "description", "progress", "listId"]) {
          if (body[k] !== undefined) allowed[k] = k === "progress" ? Number(body[k]) : body[k];
        }
        room.doc.transact(() => setEncFields(ymap, allowed, keyBytes));
        return json(res, 200, { ok: true });
      }
      if (req.method === "DELETE" && itemId) {
        yTasks.delete(itemId);
        return json(res, 200, { ok: true });
      }
    }

    // --- Room overview ---
    if (!resource && req.method === "GET") {
      const lists = [];
      yLists.forEach((val) => { const o = ymapToObj(val, keyBytes); if (o) lists.push(o); });
      lists.sort((a, b) => a.createdAt - b.createdAt);
      const tasks = [];
      yTasks.forEach((val) => { const o = ymapToObj(val, keyBytes); if (o) tasks.push(o); });
      tasks.sort((a, b) => a.createdAt - b.createdAt);
      return json(res, 200, { lists, tasks });
    }

  } catch (e) {
    return json(res, 400, { error: e.message });
  }

  return json(res, 405, { error: "Method not allowed" });
}

// --- HTTP + WebSocket ---

const server = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, conns: totalConns() }));
    return;
  }

  // REST API: /room/:id/...
  try {
    const handled = await handleRest(req, res);
    if (handled !== false) return;
  } catch (e) {
    if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    return;
  }

  res.writeHead(404);
  res.end();
});

function totalConns() {
  let n = 0;
  for (const room of rooms.values()) n += room.conns.size;
  return n;
}

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const roomName = (req.url || "/").slice(1) || "default";
  const ip = getClientIp(req);

  // Validate room
  if (!validateRoom(roomName)) {
    ws.close(4001, "Invalid room ID");
    return;
  }

  // Global limit
  if (totalConns() >= MAX_CONNS) {
    ws.close(4002, "Server full");
    return;
  }

  // Per-IP limit
  if (ipConnCount(ip) >= MAX_CONNS_PER_IP) {
    ws.close(4003, "Too many connections from this IP");
    return;
  }

  // Rate limit
  if (!checkRateLimit(ip)) {
    ws.close(4004, "Rate limited");
    return;
  }

  trackConn(ip, ws);
  const room = getRoom(roomName);
  room.conns.add(ws);
  console.log(`+ ${roomName} [${ip}] (${room.conns.size} in room, ${totalConns()} total)`);

  // Sync step 1
  const enc1 = encoding.createEncoder();
  encoding.writeVarUint(enc1, MSG_SYNC);
  syncProtocol.writeSyncStep1(enc1, room.doc);
  ws.send(encoding.toUint8Array(enc1));

  // Send current awareness
  const awStates = room.awareness.getStates();
  if (awStates.size > 0) {
    const awEnc = encoding.createEncoder();
    encoding.writeVarUint(awEnc, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      awEnc,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(awStates.keys()))
    );
    ws.send(encoding.toUint8Array(awEnc));
  }

  // Broadcast doc updates to all OTHER connections in the room
  const onUpdate = (update, origin) => {
    if (origin === ws) return; // don't echo back to sender
    // Only the listener for the SENDER should broadcast (origin is the sender ws)
    // This listener fires for every ws, so we only act if we're not the origin
    // We send to THIS ws (the one this listener belongs to)
    if (ws.readyState === 1) {
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MSG_SYNC);
      syncProtocol.writeUpdate(enc, update);
      ws.send(encoding.toUint8Array(enc));
    }
  };
  room.doc.on("update", onUpdate);

  // Broadcast awareness to THIS ws
  const onAwareness = ({ added, updated, removed }, origin) => {
    if (origin === ws) return;
    if (ws.readyState === 1) {
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        enc,
        awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...added, ...updated, ...removed])
      );
      ws.send(encoding.toUint8Array(enc));
    }
  };
  room.awareness.on("update", onAwareness);

  ws.on("message", (data) => handleMessage(ws, room, data));

  // Ping/pong keepalive — prevents Cloudflare/Railway proxy from killing idle connections
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("close", () => {
    room.conns.delete(ws);
    room.doc.off("update", onUpdate);
    room.awareness.off("update", onAwareness);
    untrackConn(ip, ws);
    console.log(`- ${roomName} [${ip}] (${room.conns.size} in room)`);

    // Flush immediately when last client leaves — don't gamble on the debounce timer
    if (room.conns.size === 0) {
      clearTimeout(room.persistTimer);
      room.persistNow();
    }
  });
});

// Ping/pong interval — kill dead connections, keep alive ones alive through proxies
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, PING_MS);

// Graceful shutdown
function shutdown() {
  console.log("Shutting down — flushing all rooms...");
  clearInterval(pingInterval);
  for (const [name] of rooms) flushRoom(name);
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(PORT, () => {
  console.log(`🪣 Bucket sync: ws://0.0.0.0:${PORT}`);
  console.log(`💾 Data: ${path.resolve(DATA_DIR)}`);
  console.log(`📦 Backups: ${path.resolve(BACKUP_DIR)} (7-day retention)`);
  console.log(`🔒 Limits: ${MAX_CONNS} global, ${MAX_CONNS_PER_IP}/IP, ${RATE_MAX}/min/IP`);
});
