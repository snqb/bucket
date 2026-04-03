/**
 * Bucket Telegram Bot
 *
 * Send text → task. Everything else is buttons.
 */

import { Bot, InlineKeyboard, Keyboard } from "grammy";
import * as E from "@evolu/common";
import type { ListId, TaskId } from "@bucket/core";
import { createNodeEvolu } from "./evolu-node.ts";

// ── Config ────────────────────────────────────────────────────

const BOT_TOKEN = process.env.BUCKET_BOT_TOKEN;
const MNEMONIC = process.env.BUCKET_MNEMONIC;

if (!BOT_TOKEN) throw new Error("BUCKET_BOT_TOKEN env required");
if (!MNEMONIC) throw new Error("BUCKET_MNEMONIC env required");

// ── Evolu ─────────────────────────────────────────────────────

const evolu = await createNodeEvolu(MNEMONIC);

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

const DEFAULT_LIST = "Bucket";
const DEFAULT_EMOJI = "🪣";

const getLists = () => evolu.loadQuery(listsQ);
const getTasks = () => evolu.loadQuery(allTasksQ);

async function ensureBucketList(): Promise<ListId> {
  const lists = await getLists();
  const found = lists.find(
    (l) => l.title?.toLowerCase() === DEFAULT_LIST.toLowerCase(),
  );
  if (found) return found.id as ListId;

  const r = evolu.insert("list", {
    title: DEFAULT_LIST as any,
    emoji: DEFAULT_EMOJI as any,
    position: 0 as any,
  });
  if (!r.ok) throw new Error("Failed to create Bucket list");
  return r.value.id;
}

function bar(p: number): string {
  const n = Math.round(p / 10);
  return "▓".repeat(n) + "░".repeat(10 - n);
}

/** The persistent reply keyboard — always visible */
const mainKb = new Keyboard()
  .text("🪣 Bucket").text("📋 Lists").row()
  .text("↗️ Move").row()
  .resized()
  .persistent();

// ── Bot ───────────────────────────────────────────────────────

const bot = new Bot(BOT_TOKEN);

// /start — show keyboard
bot.command("start", (ctx) =>
  ctx.reply("🪣 Send me anything — it becomes a task.", {
    reply_markup: mainKb,
  }),
);

// ── Button: 🪣 Bucket — show tasks in default list ───────────

bot.hears("🪣 Bucket", async (ctx) => {
  const [lists, tasks] = await Promise.all([getLists(), getTasks()]);
  const list = lists.find(
    (l) => l.title?.toLowerCase() === DEFAULT_LIST.toLowerCase(),
  );
  if (!list) return ctx.reply("Bucket list is empty. Send me something!");

  const listTasks = tasks.filter((t) => t.listId === list.id);
  if (!listTasks.length) {
    return ctx.reply("🪣 Empty. Send me text to add tasks.", {
      reply_markup: mainKb,
    });
  }

  // Show tasks with inline ✅ buttons
  const kb = new InlineKeyboard();
  const lines: string[] = [];
  for (const t of listTasks.slice(0, 30)) {
    const p = t.progress ?? 0;
    lines.push(`${bar(p)} ${p}% ${t.title}`);
    kb.text("✅", `done:${t.id}`).text("🗑", `del:${t.id}`).row();
  }

  await ctx.reply(`🪣 *Bucket*\n\n${lines.join("\n")}`, {
    parse_mode: "Markdown",
    reply_markup: kb,
  });
});

// ── Button: 📋 Lists — show all lists ────────────────────────

bot.hears("📋 Lists", async (ctx) => {
  const [lists, tasks] = await Promise.all([getLists(), getTasks()]);
  if (!lists.length) return ctx.reply("No lists yet.", { reply_markup: mainKb });

  const kb = new InlineKeyboard();
  const lines: string[] = [];
  for (const l of lists) {
    const n = tasks.filter((t) => t.listId === l.id).length;
    lines.push(`${l.emoji ?? "📋"} *${l.title}* — ${n}`);
    kb.text(`${l.emoji ?? "📋"} ${l.title}`, `list:${l.id}`).row();
  }

  await ctx.reply(`${lines.join("\n")}\n\n↓ Tap to view`, {
    parse_mode: "Markdown",
    reply_markup: kb,
  });
});

// Callback: view a specific list's tasks
bot.callbackQuery(/^list:(.+)$/, async (ctx) => {
  const listId = ctx.match![1];
  const [lists, tasks] = await Promise.all([getLists(), getTasks()]);
  const list = lists.find((l) => l.id === listId);
  if (!list) return ctx.answerCallbackQuery("List not found");

  const listTasks = tasks.filter((t) => t.listId === listId);
  if (!listTasks.length) {
    await ctx.editMessageText(`${list.emoji ?? "📋"} *${list.title}* — empty`, {
      parse_mode: "Markdown",
    });
    return ctx.answerCallbackQuery();
  }

  const kb = new InlineKeyboard();
  const lines: string[] = [];
  for (const t of listTasks.slice(0, 30)) {
    const p = t.progress ?? 0;
    lines.push(`${bar(p)} ${p}% ${t.title}`);
    kb.text("✅", `done:${t.id}`).text("🗑", `del:${t.id}`).row();
  }

  await ctx.editMessageText(
    `${list.emoji ?? "📋"} *${list.title}*\n\n${lines.join("\n")}`,
    { parse_mode: "Markdown", reply_markup: kb },
  );
  await ctx.answerCallbackQuery();
});

// ── Button: ↗️ Move — pick task, pick destination ─────────────

bot.hears("↗️ Move", async (ctx) => {
  const tasks = await getTasks();
  if (!tasks.length)
    return ctx.reply("No tasks to move.", { reply_markup: mainKb });

  const kb = new InlineKeyboard();
  for (const t of tasks.slice(0, 20)) {
    kb.text(t.title!.slice(0, 40), `mv:${t.id}`).row();
  }
  await ctx.reply("Pick task:", { reply_markup: kb });
});

bot.callbackQuery(/^mv:(.+)$/, async (ctx) => {
  const taskId = ctx.match![1];
  const lists = await getLists();

  const kb = new InlineKeyboard();
  for (const l of lists) {
    kb.text(`${l.emoji ?? "📋"} ${l.title}`, `to:${taskId}:${l.id}`).row();
  }
  await ctx.editMessageText("Move to:", { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^to:(.+):(.+)$/, async (ctx) => {
  const [, taskId, listId] = ctx.match!;
  evolu.update("task", { id: taskId as TaskId, listId: listId as ListId });

  const lists = await getLists();
  const list = lists.find((l) => l.id === listId);
  await ctx.editMessageText(
    `✅ → ${list?.emoji ?? "📋"} ${list?.title ?? "list"}`,
  );
  await ctx.answerCallbackQuery();
});

// ── Inline: ✅ done / 🗑 delete ──────────────────────────────

bot.callbackQuery(/^done:(.+)$/, async (ctx) => {
  const taskId = ctx.match![1] as TaskId;
  evolu.update("task", { id: taskId, isDeleted: E.sqliteTrue });
  await ctx.answerCallbackQuery("✅ Done");
  // Remove the button row — edit message to refresh
  try {
    const tasks = await getTasks();
    const text = ctx.callbackQuery.message?.text ?? "";
    // Just acknowledge, user can tap 🪣 Bucket to refresh
    await ctx.editMessageText(text + "\n\n_updated_", {
      parse_mode: "Markdown",
    });
  } catch {}
});

bot.callbackQuery(/^del:(.+)$/, async (ctx) => {
  const taskId = ctx.match![1] as TaskId;
  evolu.update("task", { id: taskId, isDeleted: E.sqliteTrue });
  await ctx.answerCallbackQuery("🗑 Deleted");
  try {
    const text = ctx.callbackQuery.message?.text ?? "";
    await ctx.editMessageText(text + "\n\n_updated_", {
      parse_mode: "Markdown",
    });
  } catch {}
});

// ── Default: text → task ──────────────────────────────────────

bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;

  const listId = await ensureBucketList();
  const title = ctx.message.text.trim().slice(0, 100);
  if (!title) return;

  const r = evolu.insert("task", {
    title: title as any,
    listId,
    progress: 0 as any,
  });

  await ctx.reply(r.ok ? "📌" : "❌", { reply_markup: mainKb });
});

// ── Start ─────────────────────────────────────────────────────

console.log("🪣 Bucket bot starting...");
bot.start();
