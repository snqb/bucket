/**
 * Bucket store — Yjs-based offline-first CRDT state.
 *
 * Data lives in a single Y.Doc with two Y.Maps:
 *   lists: Map<id, { id, title, emoji, createdAt }>
 *   tasks: Map<id, { id, listId, title, description, progress, createdAt }>
 *
 * Offline: IndexedDB persister (y-indexeddb)
 * Sync:    WebSocket provider (y-websocket) — connects when roomId is set
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
export const yLists = doc.getMap<List>("lists");
export const yTasks = doc.getMap<Task>("tasks");

// --- Persistence & Sync ---

let persistence: IndexeddbPersistence | null = null;
let wsProvider: WebsocketProvider | null = null;
let currentRoom: string | null = null;

const WS_URL =
  import.meta.env.VITE_SYNC_URL ||
  (typeof location !== "undefined" && location.hostname !== "localhost"
    ? `wss://${location.hostname.replace("bucket", "bucket-sync")}`
    : "ws://localhost:8040");

/** Initialize offline persistence + optional sync for a room */
export function connect(roomId: string) {
  if (currentRoom === roomId) return;
  disconnect();
  currentRoom = roomId;

  // Offline first — IndexedDB
  persistence = new IndexeddbPersistence(`bucket-${roomId}`, doc);
  persistence.once("synced", () => console.log("💾 IndexedDB loaded"));

  // Online sync — WebSocket (fails gracefully offline)
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

// --- Room ID (identity) ---

const ROOM_KEY = "bucket-room";

export function getRoomId(): string | null {
  return localStorage.getItem(ROOM_KEY);
}

export function setRoomId(id: string) {
  localStorage.setItem(ROOM_KEY, id);
  connect(id);
}

export function generateRoomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

// --- CRUD ---

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function createList(title: string, emoji = "📋"): string {
  const id = uid();
  yLists.set(id, { id, title, emoji, createdAt: Date.now() });
  return id;
}

export function deleteList(id: string) {
  // Delete tasks in this list
  yTasks.forEach((task, taskId) => {
    if (task.listId === id) yTasks.delete(taskId);
  });
  yLists.delete(id);
}

export function updateList(id: string, updates: Partial<List>) {
  const list = yLists.get(id);
  if (list) yLists.set(id, { ...list, ...updates });
}

export function createTask(listId: string, title: string): string {
  const id = uid();
  yTasks.set(id, {
    id,
    listId,
    title,
    description: "",
    progress: 0,
    createdAt: Date.now(),
  });
  return id;
}

export function updateTask(id: string, updates: Partial<Task>) {
  const task = yTasks.get(id);
  if (task) yTasks.set(id, { ...task, ...updates });
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

// Fire listeners on any Y.Map change
yLists.observeDeep(() => listeners.forEach((fn) => fn()));
yTasks.observeDeep(() => listeners.forEach((fn) => fn()));

// --- Snapshots (for rendering) ---

export function getLists(): List[] {
  return Array.from(yLists.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function getTasksForList(listId: string): Task[] {
  return Array.from(yTasks.values())
    .filter((t) => t.listId === listId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

// --- Boot ---

export function boot() {
  const room = getRoomId();
  if (room) connect(room);
}
