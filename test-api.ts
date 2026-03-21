#!/usr/bin/env -S deno run --allow-all
/**
 * Bucket REST API tests — run against a local server on :8040
 * Usage: ./test-api.ts [--url http://localhost:8040]
 */
import { parseArgs } from "jsr:@std/cli";
import { assertEquals, assertExists } from "jsr:@std/assert";

const args = parseArgs(Deno.args, { string: ["url"], default: { url: "http://localhost:8040" } });
const BASE = args.url;
const ROOM = "test" + Date.now().toString(36);
const ENC_KEY = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let passed = 0;
let failed = 0;

async function api(method: string, path: string, body?: unknown, encKey?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (encKey) headers["X-Enc-Key"] = encKey;
  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}/room/${ROOM}${path}`, opts);
  return { status: r.status, data: await r.json() };
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}: ${(e as Error).message}`);
    failed++;
  }
}

// --- Tests ---

console.log(`\n🧪 Bucket API Tests (room: ${ROOM})\n`);

console.log("📋 Lists CRUD");

let listId = "";
await test("Create list", async () => {
  const { status, data } = await api("POST", "/lists", { title: "Test List", emoji: "🧪" });
  assertEquals(status, 201);
  assertExists(data.id);
  listId = data.id;
});

await test("Get lists", async () => {
  const { status, data } = await api("GET", "/lists");
  assertEquals(status, 200);
  assertEquals(data.length, 1);
  assertEquals(data[0].title, "Test List");
  assertEquals(data[0].emoji, "🧪");
});

await test("Update list title", async () => {
  const { status } = await api("PATCH", `/lists/${listId}`, { title: "Updated List" });
  assertEquals(status, 200);
  const { data } = await api("GET", "/lists");
  assertEquals(data[0].title, "Updated List");
});

await test("Update list emoji", async () => {
  await api("PATCH", `/lists/${listId}`, { emoji: "🚀" });
  const { data } = await api("GET", "/lists");
  assertEquals(data[0].emoji, "🚀");
});

console.log("\n📝 Tasks CRUD");

let taskId1 = "", taskId2 = "";
await test("Create task", async () => {
  const { status, data } = await api("POST", "/tasks", { listId, title: "First task", description: "desc" });
  assertEquals(status, 201);
  assertExists(data.id);
  taskId1 = data.id;
});

await test("Create second task", async () => {
  const { data } = await api("POST", "/tasks", { listId, title: "Second task" });
  taskId2 = data.id;
});

await test("Get all tasks", async () => {
  const { data } = await api("GET", "/tasks");
  assertEquals(data.length, 2);
});

await test("Filter tasks by list", async () => {
  const { data } = await api("GET", `/tasks?list=${listId}`);
  assertEquals(data.length, 2);
  const { data: empty } = await api("GET", "/tasks?list=nonexistent");
  assertEquals(empty.length, 0);
});

await test("Update task progress", async () => {
  await api("PATCH", `/tasks/${taskId1}`, { progress: 75 });
  const { data } = await api("GET", "/tasks");
  const t = data.find((t: { id: string }) => t.id === taskId1);
  assertEquals(t.progress, 75);
});

await test("Update task title", async () => {
  await api("PATCH", `/tasks/${taskId1}`, { title: "Renamed task" });
  const { data } = await api("GET", "/tasks");
  const t = data.find((t: { id: string }) => t.id === taskId1);
  assertEquals(t.title, "Renamed task");
});

await test("Update task description", async () => {
  await api("PATCH", `/tasks/${taskId1}`, { description: "new desc" });
  const { data } = await api("GET", "/tasks");
  const t = data.find((t: { id: string }) => t.id === taskId1);
  assertEquals(t.description, "new desc");
});

await test("Delete task", async () => {
  await api("DELETE", `/tasks/${taskId2}`);
  const { data } = await api("GET", "/tasks");
  assertEquals(data.length, 1);
});

await test("Task requires listId", async () => {
  const { status } = await api("POST", "/tasks", { title: "No list" });
  assertEquals(status, 400);
});

console.log("\n🔐 Encryption");

const ENC_ROOM_ORIG = ROOM;
const ENC_ROOM = ROOM + "enc";

async function encApi(method: string, path: string, body?: unknown, key?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["X-Enc-Key"] = key;
  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}/room/${ENC_ROOM}${path}`, opts);
  return { status: r.status, data: await r.json() };
}

let encListId = "", encTaskId = "";
await test("Create encrypted list", async () => {
  const { data } = await encApi("POST", "/lists", { title: "Secret", emoji: "🔒" }, ENC_KEY);
  encListId = data.id;
});

await test("Create encrypted task", async () => {
  const { data } = await encApi("POST", "/tasks", { listId: encListId, title: "Hidden task", description: "Classified" }, ENC_KEY);
  encTaskId = data.id;
});

await test("Read without key returns ciphertext", async () => {
  const { data } = await encApi("GET", "");
  const task = data.tasks[0];
  // Encrypted fields start with \x01
  assertEquals(task.title.startsWith("\x01"), true, "Title should be encrypted");
  assertEquals(task.description.startsWith("\x01"), true, "Description should be encrypted");
});

await test("Read with key returns plaintext", async () => {
  const { data } = await encApi("GET", "", undefined, ENC_KEY);
  assertEquals(data.tasks[0].title, "Hidden task");
  assertEquals(data.tasks[0].description, "Classified");
  assertEquals(data.lists[0].title, "Secret");
});

await test("Wrong key returns garbled or original", async () => {
  const wrongKey = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const { data } = await encApi("GET", "", undefined, wrongKey);
  // With wrong key, decryption fails and returns the ciphertext
  assertEquals(data.tasks[0].title !== "Hidden task", true, "Wrong key should not decrypt");
});

console.log("\n🏠 Room overview");

await test("GET /room/:id returns lists + tasks", async () => {
  const { status, data } = await api("GET", "");
  assertEquals(status, 200);
  assertExists(data.lists);
  assertExists(data.tasks);
  assertEquals(data.lists.length, 1);
  assertEquals(data.tasks.length, 1);
});

console.log("\n🛡️ Validation");

await test("Invalid room ID rejected", async () => {
  const r = await fetch(`${BASE}/room/!!!invalid/tasks`);
  assertEquals(r.status, 404); // falls through to 404
  await r.text();
});

await test("PATCH nonexistent task returns 404", async () => {
  const { status } = await api("PATCH", "/tasks/nonexistent123", { progress: 50 });
  assertEquals(status, 404);
});

await test("PATCH nonexistent list returns 404", async () => {
  const { status } = await api("PATCH", "/lists/nonexistent123", { title: "nope" });
  assertEquals(status, 404);
});

await test("CORS headers present", async () => {
  const r = await fetch(`${BASE}/room/${ROOM}`, { method: "OPTIONS" });
  assertEquals(r.status, 204);
  assertEquals(r.headers.get("access-control-allow-origin"), "*");
  await r.text();
});

console.log("\n🗑️ Cleanup");

await test("Delete list cascades to tasks", async () => {
  await api("DELETE", `/lists/${listId}`);
  const { data } = await api("GET", "");
  assertEquals(data.lists.length, 0);
  assertEquals(data.tasks.length, 0);
});

// Cleanup encrypted room too
await encApi("DELETE", `/lists/${encListId}`, undefined, ENC_KEY);

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
Deno.exit(failed > 0 ? 1 : 0);
