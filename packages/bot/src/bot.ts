/**
 * Bucket Telegram Bot
 *
 * Send a message → creates task in the default "Bucket" list.
 * /lists — show all lists
 * /move — move a task between lists (inline buttons)
 */

import { Bot, InlineKeyboard, type Context } from "grammy";
import * as E from "@evolu/common";
import type { ListId, TaskId } from "@bucket/core";
import { createNodeEvolu } from "./evolu-node.ts";

// ── Config ────────────────────────────────────────────────────

const BOT_TOKEN = process.env.BUCKET_BOT_TOKEN;
const MNEMONIC = process.env.BUCKET_MNEMONIC;

if (!BOT_TOKEN) throw new Error("BUCKET_BOT_TOKEN env required");
if (!MNEMONIC) throw new Error("BUCKET_MNEMONIC env required");

// ── Evolu ─────────────────────────────────────────────────────

const { evolu, ready } = createNodeEvolu(MNEMONIC);

// Wait for mnemonic restore before starting
await ready;
console.log("✅ Evolu restored from mnemonic");

// ── Queries ───────────────────────────────────────────────────

const listsQ = evolu.createQuery((db) =>
  db
    .selectFrom("list")
    .select(["id", "title", "emoji", "position", "createdAt"])
    .where("isDeleted", "is not", E.sqliteTrue)
    .where("title", "is not", null)
    .orderBy("position")
    .orderBy("createdAt"),
);

const allTasksQ = evolu.createQuery((db) =>
  db
    .selectFrom("task")
    .select(["id", "listId", "title", "progress", "createdAt"])
    .where("isDeleted", "is not", E.sqliteTrue)
    .where("title", "is not", null)
    .orderBy("createdAt"),
);

// ── Helpers ───────────────────────────────────────────────────

const DEFAULT_LIST_NAME = "Bucket";
const DEFAULT_LIST_EMOJI = "🪣";

async function getLists() {
  return evolu.loadQuery(listsQ);
}

async function getTasks() {
  return evolu.loadQuery(allTasksQ);
}

/** Find or create the default "Bucket" list */
async function ensureDefaultList(): Promise<ListId> {
  const lists = await getLists();
  const existing = lists.find(
    (l) => l.title.toLowerCase() === DEFAULT_LIST_NAME.toLowerCase(),
  );
  if (existing) return existing.id as ListId;

  // Create it
  const { id } = evolu.insert("list", {
    title: DEFAULT_LIST_NAME as any,
    emoji: DEFAULT_LIST_EMOJI as any,
    position: 0 as any,
  });
  return id as ListId;
}

function progressBar(p: number): string {
  const filled = Math.round(p / 10);
  return "▓".repeat(filled) + "░".repeat(10 - filled);
}

// ── Bot ───────────────────────────────────────────────────────

const bot = new Bot(BOT_TOKEN);

// /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🪣 *Bucket Bot*\n\n" +
      "Send me any text → I'll add it as a task.\n\n" +
      "Commands:\n" +
      "/lists — show all lists\n" +
      "/tasks — show tasks in Bucket\n" +
      "/move — move a task to another list",
    { parse_mode: "Markdown" },
  );
});

// /lists — show all lists with task counts
bot.command("lists", async (ctx) => {
  const [lists, tasks] = await Promise.all([getLists(), getTasks()]);
  if (lists.length === 0) {
    await ctx.reply("No lists yet. Send me a message to create your first task!");
    return;
  }

  const lines = lists.map((l) => {
    const count = tasks.filter((t) => t.listId === l.id).length;
    const emoji = l.emoji ?? "📋";
    return `${emoji} *${l.title}* — ${count} task${count !== 1 ? "s" : ""}`;
  });

  await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
});

// /tasks — show tasks in the default Bucket list
bot.command("tasks", async (ctx) => {
  const [lists, tasks] = await Promise.all([getLists(), getTasks()]);
  const bucketList = lists.find(
    (l) => l.title.toLowerCase() === DEFAULT_LIST_NAME.toLowerCase(),
  );

  const listId = ctx.match?.trim()
    ? lists.find((l) => l.title.toLowerCase() === ctx.match!.trim().toLowerCase())?.id
    : bucketList?.id;

  if (!listId) {
    await ctx.reply("List not found. Use /lists to see available lists.");
    return;
  }

  const listTasks = tasks.filter((t) => t.listId === listId);
  const list = lists.find((l) => l.id === listId);
  if (listTasks.length === 0) {
    await ctx.reply(`${list?.emoji ?? "📋"} *${list?.title}* is empty.`, {
      parse_mode: "Markdown",
    });
    return;
  }

  const lines = listTasks.map((t) => {
    const p = t.progress ?? 0;
    return `${progressBar(p)} ${p}% — ${t.title}`;
  });

  await ctx.reply(
    `${list?.emoji ?? "📋"} *${list?.title}*\n\n${lines.join("\n")}`,
    { parse_mode: "Markdown" },
  );
});

// /move — pick a task, then pick destination list
bot.command("move", async (ctx) => {
  const tasks = await getTasks();
  if (tasks.length === 0) {
    await ctx.reply("No tasks to move.");
    return;
  }

  // Show tasks as inline buttons (limit 20)
  const kb = new InlineKeyboard();
  for (const t of tasks.slice(0, 20)) {
    kb.text(`${t.title.slice(0, 30)}`, `move:pick:${t.id}`).row();
  }

  await ctx.reply("Pick a task to move:", { reply_markup: kb });
});

// Callback: picked a task → show destination lists
bot.callbackQuery(/^move:pick:(.+)$/, async (ctx) => {
  const taskId = ctx.match![1];
  const lists = await getLists();

  const kb = new InlineKeyboard();
  for (const l of lists) {
    kb.text(`${l.emoji ?? "📋"} ${l.title}`, `move:to:${taskId}:${l.id}`).row();
  }

  await ctx.editMessageText("Move to which list?", { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

// Callback: move confirmed
bot.callbackQuery(/^move:to:(.+):(.+)$/, async (ctx) => {
  const taskId = ctx.match![1] as TaskId;
  const listId = ctx.match![2] as ListId;

  evolu.update("task", { id: taskId, listId });

  const lists = await getLists();
  const list = lists.find((l) => l.id === listId);

  await ctx.editMessageText(
    `✅ Moved to ${list?.emoji ?? "📋"} ${list?.title ?? "list"}`,
  );
  await ctx.answerCallbackQuery();
});

// /done <search> — mark a task done (set progress=100, soft delete)
bot.command("done", async (ctx) => {
  const search = ctx.match?.trim().toLowerCase();
  if (!search) {
    await ctx.reply("Usage: /done <task name>");
    return;
  }

  const tasks = await getTasks();
  const task = tasks.find((t) => t.title.toLowerCase().includes(search));
  if (!task) {
    await ctx.reply(`No task matching "${search}"`);
    return;
  }

  evolu.update("task", { id: task.id as TaskId, isDeleted: E.sqliteTrue });
  await ctx.reply(`✅ Done: ${task.title}`);
});

// /del — same as done (soft delete)
bot.command("del", async (ctx) => {
  const search = ctx.match?.trim().toLowerCase();
  if (!search) {
    await ctx.reply("Usage: /del <task name>");
    return;
  }

  const tasks = await getTasks();
  const task = tasks.find((t) => t.title.toLowerCase().includes(search));
  if (!task) {
    await ctx.reply(`No task matching "${search}"`);
    return;
  }

  evolu.update("task", { id: task.id as TaskId, isDeleted: E.sqliteTrue });
  await ctx.reply(`🗑️ Deleted: ${task.title}`);
});

// Default: any text message → create task in Bucket list
bot.on("message:text", async (ctx) => {
  // Skip if it looks like a command
  if (ctx.message.text.startsWith("/")) return;

  const listId = await ensureDefaultList();

  evolu.insert("task", {
    title: ctx.message.text.trim().slice(0, 100) as any,
    listId,
    progress: 0 as any,
  });

  await ctx.reply(`📌 Added to 🪣 Bucket`);
});

// ── Start ─────────────────────────────────────────────────────

console.log("🪣 Bucket bot starting...");
bot.start();
