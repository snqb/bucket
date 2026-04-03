/**
 * Bucket Telegram Bot
 *
 * /start <mnemonic> — connect your Bucket identity
 * Send text → task in default "Bucket" list
 * Buttons for everything else.
 */

import { Bot, InlineKeyboard, Keyboard } from "grammy";
import * as E from "@evolu/common";
import type { ListId, TaskId } from "@bucket/core";
import { createNodeEvolu } from "./evolu-node.ts";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ── Config ────────────────────────────────────────────────────

const BOT_TOKEN = process.env.BUCKET_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BUCKET_BOT_TOKEN env required");

// ── Per-user Evolu instances ──────────────────────────────────

const DATA_DIR = process.env.BUCKET_DATA_DIR || "./data";
mkdirSync(DATA_DIR, { recursive: true });

type UserEvolu = Awaited<ReturnType<typeof createNodeEvolu>>;
const users = new Map<number, UserEvolu>();

function mnemonicPath(userId: number) {
  return join(DATA_DIR, `${userId}.mnemonic`);
}

function saveMnemonic(userId: number, mnemonic: string) {
  writeFileSync(mnemonicPath(userId), mnemonic.trim());
}

function loadMnemonic(userId: number): string | null {
  try {
    return readFileSync(mnemonicPath(userId), "utf-8").trim();
  } catch {
    return null;
  }
}

async function getEvolu(userId: number): Promise<UserEvolu | null> {
  if (users.has(userId)) return users.get(userId)!;
  const mnemonic = loadMnemonic(userId);
  if (!mnemonic) return null;
  const evolu = await createNodeEvolu(mnemonic, `bot-${userId}`);
  users.set(userId, evolu);
  return evolu;
}

// ── Queries (per evolu instance) ──────────────────────────────

function listsQ(evolu: UserEvolu) {
  return evolu.createQuery((db) =>
    db
      .selectFrom("list")
      .select(["id", "title", "emoji", "position", "createdAt"])
      .where("isDeleted", "is not", E.sqliteTrue)
      .where("title", "is not", null)
      .orderBy("position")
      .orderBy("createdAt"),
  );
}

function allTasksQ(evolu: UserEvolu) {
  return evolu.createQuery((db) =>
    db
      .selectFrom("task")
      .select(["id", "listId", "title", "progress", "createdAt"])
      .where("isDeleted", "is not", E.sqliteTrue)
      .where("title", "is not", null)
      .orderBy("createdAt"),
  );
}

// ── Helpers ───────────────────────────────────────────────────

const DEFAULT_LIST = "Bucket";
const DEFAULT_EMOJI = "🪣";

async function ensureBucketList(evolu: UserEvolu): Promise<ListId> {
  const lists = await evolu.loadQuery(listsQ(evolu));
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

const mainKb = new Keyboard()
  .text("🪣 Bucket")
  .text("📋 Lists")
  .row()
  .text("↗️ Move")
  .row()
  .resized()
  .persistent();

/** Middleware: require linked account */
function userId(ctx: any): number {
  return ctx.from?.id ?? 0;
}

const SETUP_MSG =
  "🪣 *Bucket*\n\n" +
  "Link your account:\n" +
  "`/start your mnemonic words here`\n\n" +
  "Get your mnemonic from bucket.esen.works → ⚙ → Show Mnemonic\n\n" +
  "Or `/start new` to create a fresh identity.";

// ── Bot ───────────────────────────────────────────────────────

const bot = new Bot(BOT_TOKEN);

// /start [mnemonic] — setup identity
bot.command("start", async (ctx) => {
  const arg = ctx.match?.trim();

  // No args — show help or keyboard if already linked
  if (!arg) {
    const ev = await getEvolu(userId(ctx));
    if (ev) {
      return ctx.reply("🪣 Send me text — it becomes a task.", {
        reply_markup: mainKb,
        parse_mode: "Markdown",
      });
    }
    return ctx.reply(SETUP_MSG, { parse_mode: "Markdown" });
  }

  // /start new — fresh identity
  if (arg.toLowerCase() === "new") {
    const evolu = await createNodeEvolu(undefined, `bot-${userId(ctx)}`);
    users.set(userId(ctx), evolu);
    const owner = await evolu.appOwner;
    const mnemonic = owner?.mnemonic ?? "(unknown)";
    saveMnemonic(userId(ctx), mnemonic);
    return ctx.reply(
      `✅ Fresh identity created.\n\nYour mnemonic (paste into web app → Restore):\n\n\`${mnemonic}\``,
      { parse_mode: "Markdown", reply_markup: mainKb },
    );
  }

  // /start <mnemonic words> — restore from mnemonic
  const m = E.Mnemonic.from(arg);
  if (!m.ok) {
    return ctx.reply("❌ Invalid mnemonic. Should be 24 words.", {
      parse_mode: "Markdown",
    });
  }

  try {
    // Kill old instance if any
    users.delete(userId(ctx));
    const evolu = await createNodeEvolu(arg, `bot-${userId(ctx)}`);
    users.set(userId(ctx), evolu);
    saveMnemonic(userId(ctx), arg);
    await ctx.reply("✅ Linked! Send me text to add tasks.", {
      reply_markup: mainKb,
    });
  } catch (e: any) {
    await ctx.reply(`❌ ${e.message}`);
  }
});

// ── Guard: require linked evolu ───────────────────────────────

async function requireEvolu(ctx: any): Promise<UserEvolu | null> {
  const ev = await getEvolu(userId(ctx));
  if (!ev) {
    await ctx.reply(SETUP_MSG, { parse_mode: "Markdown" });
    return null;
  }
  return ev;
}

// ── 🪣 Bucket — show tasks ───────────────────────────────────

bot.hears("🪣 Bucket", async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return;

  const [lists, tasks] = await Promise.all([
    ev.loadQuery(listsQ(ev)),
    ev.loadQuery(allTasksQ(ev)),
  ]);
  const list = lists.find(
    (l) => l.title?.toLowerCase() === DEFAULT_LIST.toLowerCase(),
  );

  const listTasks = list ? tasks.filter((t) => t.listId === list.id) : [];
  if (!listTasks.length) {
    return ctx.reply("🪣 Empty. Send me text to add tasks.", {
      reply_markup: mainKb,
    });
  }

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

// ── 📋 Lists ─────────────────────────────────────────────────

bot.hears("📋 Lists", async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return;

  const [lists, tasks] = await Promise.all([
    ev.loadQuery(listsQ(ev)),
    ev.loadQuery(allTasksQ(ev)),
  ]);
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

// Callback: view list tasks
bot.callbackQuery(/^list:(.+)$/, async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return ctx.answerCallbackQuery("Not linked");

  const listId = ctx.match![1];
  const [lists, tasks] = await Promise.all([
    ev.loadQuery(listsQ(ev)),
    ev.loadQuery(allTasksQ(ev)),
  ]);
  const list = lists.find((l) => l.id === listId);
  if (!list) return ctx.answerCallbackQuery("List not found");

  const listTasks = tasks.filter((t) => t.listId === listId);
  if (!listTasks.length) {
    await ctx.editMessageText(
      `${list.emoji ?? "📋"} *${list.title}* — empty`,
      { parse_mode: "Markdown" },
    );
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

// ── ↗️ Move ───────────────────────────────────────────────────

bot.hears("↗️ Move", async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return;

  const tasks = await ev.loadQuery(allTasksQ(ev));
  if (!tasks.length)
    return ctx.reply("No tasks to move.", { reply_markup: mainKb });

  const kb = new InlineKeyboard();
  for (const t of tasks.slice(0, 20)) {
    kb.text(t.title!.slice(0, 40), `mv:${t.id}`).row();
  }
  await ctx.reply("Pick task:", { reply_markup: kb });
});

bot.callbackQuery(/^mv:(.+)$/, async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return ctx.answerCallbackQuery("Not linked");

  const taskId = ctx.match![1];
  const lists = await ev.loadQuery(listsQ(ev));

  const kb = new InlineKeyboard();
  for (const l of lists) {
    kb.text(`${l.emoji ?? "📋"} ${l.title}`, `to:${taskId}:${l.id}`).row();
  }
  await ctx.editMessageText("Move to:", { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^to:(.+):(.+)$/, async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return ctx.answerCallbackQuery("Not linked");

  const [, taskId, listId] = ctx.match!;
  ev.update("task", { id: taskId as TaskId, listId: listId as ListId });

  const lists = await ev.loadQuery(listsQ(ev));
  const list = lists.find((l) => l.id === listId);
  await ctx.editMessageText(
    `✅ → ${list?.emoji ?? "📋"} ${list?.title ?? "list"}`,
  );
  await ctx.answerCallbackQuery();
});

// ── Inline: ✅ done / 🗑 delete ──────────────────────────────

bot.callbackQuery(/^done:(.+)$/, async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return ctx.answerCallbackQuery("Not linked");

  ev.update("task", {
    id: ctx.match![1] as TaskId,
    isDeleted: E.sqliteTrue,
  });
  await ctx.answerCallbackQuery("✅");
  try {
    const text = ctx.callbackQuery.message?.text ?? "";
    await ctx.editMessageText(text + "\n\n_updated_", {
      parse_mode: "Markdown",
    });
  } catch {}
});

bot.callbackQuery(/^del:(.+)$/, async (ctx) => {
  const ev = await requireEvolu(ctx);
  if (!ev) return ctx.answerCallbackQuery("Not linked");

  ev.update("task", {
    id: ctx.match![1] as TaskId,
    isDeleted: E.sqliteTrue,
  });
  await ctx.answerCallbackQuery("🗑");
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

  const ev = await requireEvolu(ctx);
  if (!ev) return;

  const listId = await ensureBucketList(ev);
  const title = ctx.message.text.trim().slice(0, 100);
  if (!title) return;

  const r = ev.insert("task", {
    title: title as any,
    listId,
    progress: 0 as any,
  });

  await ctx.reply(r.ok ? "📌" : "❌", { reply_markup: mainKb });
});

// ── Start ─────────────────────────────────────────────────────

console.log("🪣 Bucket bot starting...");
bot.start();
