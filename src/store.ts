/**
 * Bucket store — Yjs-based offline-first CRDT state.
 *
 * Each list and task is a nested Y.Map inside a parent Y.Map,
 * so concurrent edits to different fields merge without data loss.
 *
 *   lists: Y.Map<id → Y.Map { id, title, emoji, createdAt }>
 *   tasks: Y.Map<id → Y.Map { id, listId, title, description, progress, createdAt }>
 *
 * Offline: IndexedDB (y-indexeddb)
 * Sync:    WebSocket (y-websocket) — connects when roomId is set
 */

import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";

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
  createdAt: number;
};

// --- Y.Doc ---

export const doc = new Y.Doc();
const yLists = doc.getMap("lists"); // Map<id → Y.Map>
const yTasks = doc.getMap("tasks"); // Map<id → Y.Map>

// --- Nested Y.Map helpers ---

function ymapToObj<T>(ymap: Y.Map<unknown>): T {
  const obj: Record<string, unknown> = {};
  ymap.forEach((val, key) => { obj[key] = val; });
  return obj as T;
}

function setFields(ymap: Y.Map<unknown>, fields: Record<string, unknown>) {
  for (const [k, v] of Object.entries(fields)) {
    if (ymap.get(k) !== v) ymap.set(k, v);
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

export function setRoomId(id: string) {
  localStorage.setItem(ROOM_KEY, id);
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
  setFields(ymap, { id, listId, title, description: "", progress: 0, createdAt: Date.now() });
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

// --- Boot ---

export function boot() {
  const room = getRoomId();
  if (room) connect(room);
}
