/**
 * Bucket store — Yjs-based offline-first CRDT state with E2E encryption.
 *
 * Each list and task is a nested Y.Map inside a parent Y.Map,
 * so concurrent edits to different fields merge without data loss.
 *
 *   lists: Y.Map<id → Y.Map { id, title, emoji, createdAt }>
 *   tasks: Y.Map<id → Y.Map { id, listId, title, description, progress, createdAt }>
 *
 * Encryption:
 *   Text fields (title, description, emoji) are encrypted with XSalsa20-Poly1305
 *   using a per-room key. Server stores encrypted blobs, can't read content.
 *   Structural fields (id, listId, progress, createdAt) stay plaintext for CRDT.
 *
 * Offline: IndexedDB (y-indexeddb)
 * Sync:    WebSocket (y-websocket) — connects when roomId is set
 */

import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import nacl from "tweetnacl";

// --- Types ---

export type List = {
  id: string;
  title: string;
  emoji: string;
  createdAt: number;
};

export type Task = {
  id: string;
  listId: string;
  title: string;
  description: string;
  progress: number;
  dueDate: string; // ISO date string "YYYY-MM-DD" or ""
  createdAt: number;
};

// --- Y.Doc ---

export const doc = new Y.Doc();
const yLists = doc.getMap("lists"); // Map<id → Y.Map>
const yTasks = doc.getMap("tasks"); // Map<id → Y.Map>

// --- Encryption ---

const ENC_FIELDS = new Set(["title", "description", "emoji"]);
const ENC_PREFIX = "\x01";
const ENC_STORE = "bucket-enc-";
let encKey: Uint8Array | null = null;

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export function generateEncKey(): string {
  return toB64(nacl.randomBytes(32));
}

export function saveEncKey(roomId: string, key: string) {
  localStorage.setItem(ENC_STORE + roomId, key);
  encKey = fromB64(key);
}

export function getEncKeyStr(): string | null {
  const room = getRoomId();
  return room ? localStorage.getItem(ENC_STORE + room) : null;
}

function loadEncKey(roomId: string) {
  const stored = localStorage.getItem(ENC_STORE + roomId);
  encKey = stored ? fromB64(stored) : null;
}

function enc(plain: string): string {
  if (!encKey) return plain;
  const nonce = nacl.randomBytes(24);
  const msg = new TextEncoder().encode(plain);
  const box = nacl.secretbox(msg, nonce, encKey);
  const full = new Uint8Array(24 + box.length);
  full.set(nonce);
  full.set(box, 24);
  return ENC_PREFIX + toB64(full);
}

function dec(val: string): string {
  if (!encKey || typeof val !== "string" || val[0] !== ENC_PREFIX) return val;
  try {
    const full = fromB64(val.slice(1));
    const nonce = full.slice(0, 24);
    const box = full.slice(24);
    const msg = nacl.secretbox.open(box, nonce, encKey);
    if (!msg) return val;
    return new TextDecoder().decode(msg);
  } catch {
    return val; // legacy plaintext or corrupted
  }
}

// --- Nested Y.Map helpers ---

function ymapToObj<T>(ymap: Y.Map<unknown>): T {
  const obj: Record<string, unknown> = {};
  ymap.forEach((val, key) => {
    obj[key] = ENC_FIELDS.has(key) && typeof val === "string" ? dec(val) : val;
  });
  return obj as T;
}

function setFields(ymap: Y.Map<unknown>, fields: Record<string, unknown>) {
  for (const [k, v] of Object.entries(fields)) {
    if (encKey && ENC_FIELDS.has(k)) {
      const cur = ymap.get(k);
      const curPlain = typeof cur === "string" ? dec(cur) : undefined;
      if (curPlain !== String(v)) ymap.set(k, enc(String(v)));
    } else {
      if (ymap.get(k) !== v) ymap.set(k, v);
    }
  }
}

// --- Persistence & Sync ---

let persistence: IndexeddbPersistence | null = null;
let wsProvider: WebsocketProvider | null = null;
let currentRoom: string | null = null;

const WS_URL =
  import.meta.env.VITE_SYNC_URL ||
  (typeof location !== "undefined" && location.hostname !== "localhost"
    ? `wss://${location.hostname.replace("bucket", "bucket-sync")}`
    : "ws://localhost:8040");

export function connect(roomId: string) {
  if (currentRoom === roomId) return;
  disconnect();
  currentRoom = roomId;
  loadEncKey(roomId);

  persistence = new IndexeddbPersistence(`bucket-${roomId}`, doc);
  persistence.once("synced", () => console.log("💾 IndexedDB loaded"));

  try {
    wsProvider = new WebsocketProvider(WS_URL, roomId, doc, {
      connect: true,
      maxBackoffTime: 10000,
    });
    wsProvider.on("status", ({ status }: { status: string }) => {
      console.log(`🔄 Sync: ${status}`);
      listeners.forEach((fn) => fn());
    });
  } catch {
    console.log("🔌 Sync unavailable, working offline");
  }
}

export function disconnect() {
  wsProvider?.destroy();
  wsProvider = null;
  persistence?.destroy();
  persistence = null;
  currentRoom = null;
  encKey = null;
}

export function getSyncStatus(): "connected" | "connecting" | "disconnected" {
  if (!wsProvider) return "disconnected";
  return wsProvider.wsconnected
    ? "connected"
    : wsProvider.wsconnecting
      ? "connecting"
      : "disconnected";
}

// --- Room ID ---

const ROOM_KEY = "bucket-room";

export function getRoomId(): string | null {
  return localStorage.getItem(ROOM_KEY);
}

export function setRoomId(id: string, encryptionKey?: string) {
  localStorage.setItem(ROOM_KEY, id);
  if (encryptionKey) saveEncKey(id, encryptionKey);
  connect(id);
}

export function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

// --- CRUD ---

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function createList(title: string, emoji = "📋"): string {
  const id = uid();
  const ymap = new Y.Map();
  setFields(ymap, { id, title, emoji, createdAt: Date.now() });
  yLists.set(id, ymap);
  return id;
}

export function deleteList(id: string) {
  yTasks.forEach((_task, taskId) => {
    const tm = yTasks.get(taskId) as Y.Map<unknown> | undefined;
    if (tm && tm.get("listId") === id) yTasks.delete(taskId);
  });
  yLists.delete(id);
}

export function updateList(id: string, updates: Partial<List>) {
  const ymap = yLists.get(id) as Y.Map<unknown> | undefined;
  if (ymap) {
    doc.transact(() => setFields(ymap, updates));
  }
}

export function createTask(listId: string, title: string): string {
  const id = uid();
  const ymap = new Y.Map();
  setFields(ymap, { id, listId, title, description: "", progress: 0, dueDate: "", createdAt: Date.now() });
  yTasks.set(id, ymap);
  return id;
}

export function updateTask(id: string, updates: Partial<Task>) {
  const ymap = yTasks.get(id) as Y.Map<unknown> | undefined;
  if (ymap) {
    doc.transact(() => setFields(ymap, updates));
  }
}

export function deleteTask(id: string) {
  yTasks.delete(id);
}

// --- Reactive subscriptions ---

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

yLists.observeDeep(() => listeners.forEach((fn) => fn()));
yTasks.observeDeep(() => listeners.forEach((fn) => fn()));

// --- Snapshots ---

export function getLists(): List[] {
  const out: List[] = [];
  yLists.forEach((val) => {
    if (val instanceof Y.Map) out.push(ymapToObj<List>(val));
  });
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

export function getTasksForList(listId: string): Task[] {
  const out: Task[] = [];
  yTasks.forEach((val) => {
    if (val instanceof Y.Map) {
      const t = ymapToObj<Task>(val);
      if (t.listId === listId) out.push(t);
    }
  });
  return out.sort((a, b) => a.createdAt - b.createdAt);
}

// --- Restore (for undo) ---

export function restoreTask(data: Task) {
  const ymap = new Y.Map();
  setFields(ymap, data as unknown as Record<string, unknown>);
  yTasks.set(data.id, ymap);
}

export function restoreList(data: List) {
  const ymap = new Y.Map();
  setFields(ymap, data as unknown as Record<string, unknown>);
  yLists.set(data.id, ymap);
}

// --- Leave room ---

export function leaveRoom() {
  disconnect();
  localStorage.removeItem(ROOM_KEY);
  listeners.forEach((fn) => fn());
}

// --- Boot ---

export function boot() {
  const room = getRoomId();
  if (room) connect(room);
}
