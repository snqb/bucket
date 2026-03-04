#!/usr/bin/env node

/**
 * Bucket sync server — Yjs WebSocket relay with disk persistence.
 *
 * Each room gets its own Y.Doc. Persisted to ./data/<room>.yjs.
 * Idle rooms are evicted from memory after 10 minutes.
 *
 * Env:
 *   PORT      (default 8040)
 *   DATA_DIR  (default ./data)
 *   MAX_CONNS (default 100)
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
const MAX_CONNS = parseInt(process.env.MAX_CONNS || "100", 10);
const IDLE_MS = 10 * 60 * 1000; // evict after 10min idle
const PERSIST_MS = 2000; // debounce writes

fs.mkdirSync(DATA_DIR, { recursive: true });

// --- Room state ---

const rooms = new Map(); // room -> { doc, awareness, conns, lastAccess, persistTimer }

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

  // Load from disk
  if (fs.existsSync(file)) {
    try {
      Y.applyUpdate(doc, fs.readFileSync(file));
    } catch (e) {
      console.error(`⚠️ Corrupt data for ${name}, starting fresh`);
    }
  }

  // Debounced persistence
  let persistTimer = null;
  const persist = () => {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      fs.writeFileSync(file, Y.encodeStateAsUpdate(doc));
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

function evictRoom(name) {
  const room = rooms.get(name);
  if (!room || room.conns.size > 0) return;

  // Final persist
  clearTimeout(room.persistTimer);
  fs.writeFileSync(room.file, Y.encodeStateAsUpdate(room.doc));

  room.doc.destroy();
  room.awareness.destroy();
  rooms.delete(name);
  console.log(`🗑️ Evicted ${name} (${rooms.size} active)`);
}

// Eviction sweep
setInterval(() => {
  const now = Date.now();
  for (const [name, room] of rooms) {
    if (room.conns.size === 0 && now - room.lastAccess > IDLE_MS) {
      evictRoom(name);
    }
  }
}, 60_000);

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

  // Validate
  if (!validateRoom(roomName)) {
    ws.close(4001, "Invalid room ID");
    return;
  }
  if (totalConns() >= MAX_CONNS) {
    ws.close(4002, "Server full");
    return;
  }

  const room = getRoom(roomName);
  room.conns.add(ws);
  console.log(`+ ${roomName} (${room.conns.size} in room)`);

  // Send sync step 1
  const enc1 = encoding.createEncoder();
  encoding.writeVarUint(enc1, MSG_SYNC);
  syncProtocol.writeSyncStep1(enc1, room.doc);
  ws.send(encoding.toUint8Array(enc1));

  // Send current awareness
  const awStates = room.awareness.getStates();
  if (awStates.size > 0) {
    const awEnc = encoding.createEncoder();
    encoding.writeVarUint(awEnc, MSG_AWARENESS);
    encoding.writeVarUint8Array(awEnc,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(awStates.keys()))
    );
    ws.send(encoding.toUint8Array(awEnc));
  }

  // Broadcast updates to peers
  const onUpdate = (update, origin) => {
    if (origin === ws) return;
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MSG_SYNC);
    syncProtocol.writeUpdate(enc, update);
    const msg = encoding.toUint8Array(enc);
    for (const peer of room.conns) {
      if (peer !== ws && peer.readyState === 1) peer.send(msg);
    }
  };
  room.doc.on("update", onUpdate);

  const onAwareness = ({ added, updated, removed }) => {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MSG_AWARENESS);
    encoding.writeVarUint8Array(enc,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...added, ...updated, ...removed])
    );
    const msg = encoding.toUint8Array(enc);
    for (const peer of room.conns) {
      if (peer !== ws && peer.readyState === 1) peer.send(msg);
    }
  };
  room.awareness.on("update", onAwareness);

  ws.on("message", (data) => handleMessage(ws, room, data));

  ws.on("close", () => {
    room.conns.delete(ws);
    room.doc.off("update", onUpdate);
    room.awareness.off("update", onAwareness);
    console.log(`- ${roomName} (${room.conns.size} in room)`);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  for (const [name, room] of rooms) {
    clearTimeout(room.persistTimer);
    fs.writeFileSync(room.file, Y.encodeStateAsUpdate(room.doc));
  }
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`🪣 Bucket sync: ws://0.0.0.0:${PORT}`);
  console.log(`💾 Data: ${path.resolve(DATA_DIR)}`);
});
