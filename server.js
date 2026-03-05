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

const PORT = parseInt(process.env.PORT || "8040", 10);
const DATA_DIR = process.env.DATA_DIR || "./data";
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_CONNS = parseInt(process.env.MAX_CONNS || "200", 10);
const MAX_CONNS_PER_IP = parseInt(process.env.MAX_CONNS_PER_IP || "5", 10);
const IDLE_MS = 10 * 60 * 1000;
const PERSIST_MS = 2000;

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
      console.error(`⚠️ Corrupt data for ${name}, starting fresh`);
    }
  }

  let persistTimer = null;
  const persist = () => {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      try {
        fs.writeFileSync(file, Y.encodeStateAsUpdate(doc));
      } catch (e) {
        console.error(`⚠️ Write failed for ${name}:`, e.message);
      }
    }, PERSIST_MS);
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
    fs.writeFileSync(room.file, Y.encodeStateAsUpdate(room.doc));
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

// --- HTTP + WebSocket ---

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, conns: totalConns() }));
  } else {
    res.writeHead(404);
    res.end();
  }
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

  ws.on("close", () => {
    room.conns.delete(ws);
    room.doc.off("update", onUpdate);
    room.awareness.off("update", onAwareness);
    untrackConn(ip, ws);
    console.log(`- ${roomName} [${ip}] (${room.conns.size} in room)`);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down — flushing all rooms...");
  for (const [name] of rooms) flushRoom(name);
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`🪣 Bucket sync: ws://0.0.0.0:${PORT}`);
  console.log(`💾 Data: ${path.resolve(DATA_DIR)}`);
  console.log(`📦 Backups: ${path.resolve(BACKUP_DIR)} (7-day retention)`);
  console.log(`🔒 Limits: ${MAX_CONNS} global, ${MAX_CONNS_PER_IP}/IP, ${RATE_MAX}/min/IP`);
});
