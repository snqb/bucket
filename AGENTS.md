<!-- Updated: 2026-04-03 -->
# bucket v2

> Progress bars, not checkboxes. Local-first PWA powered by Evolu.

## Architecture

```
packages/core/     Evolu schema, queries, branded types (shared)
packages/web/      Vite + React + Tailwind 4 PWA
packages/bot/      Telegram bot (grammY + headless Evolu via better-sqlite3)
relay/             Self-hosted Evolu relay (Node 22, Docker)
```

**Planned:**
```
cli/               Deno CLI (read/write tasks from terminal)
skill/             Pi skill (bucket commands in agent sessions)
packages/mobile/   React Native (Expo) — same core
```

## How It Works

```
browser → SQLite WASM (OPFS) → Evolu CRDT ←→ WebSocket relay ←→ other devices
                                  ↕                               ↕
                            relay disk (./data/*.db)        TG bot (better-sqlite3)
```

- **Evolu** handles sync, E2E encryption, offline-first, conflict resolution
- **SQLite** (not Yjs) — real SQL queries via Kysely
- **Passkey auth** — mnemonic backup for cross-device sync
- **No room IDs** — identity is cryptographic (OwnerId from mnemonic)

## Schema (packages/core/src/schema.ts)

Two tables: `list` and `task`. Evolu auto-adds `id`, `createdAt`, `updatedAt`, `isDeleted`.

```ts
list: { title: NonEmptyString100, emoji: nullOr(String100), position: nullOr(Int) }
task: { listId: ListId, title: NonEmptyString100, description: nullOr(String1000),
        progress: nullOr(NonNegativeInt), dueDate: nullOr(DateIso), position: nullOr(Int) }
```

## Running

```bash
pnpm dev                    # web on :5173 (or next free port)
cd relay && pnpm dev        # relay on :4000

# Bot
cd packages/bot
BUCKET_BOT_TOKEN=$(pass bucket/bot-token) node --import tsx/esm src/bot.ts
```

## Gotchas

- **Top-level await in evolu.ts** — `localAuth.getOwner()` is async. Vite handles TLA fine, but SSR would break.
- **exactOptionalPropertyTypes** — required by Evolu. Config objects must use spread, not mutation.
- **Soft delete** — `isDeleted` flag, not actual DELETE. All queries must filter `.where("isDeleted", "is not", sqliteTrue)`.
- **Progress is NonNegativeInt** — clamped 0–100 in UI, but schema allows any non-negative int. Validate in app layer.
- **optimizeDeps.exclude** — `@evolu/sqlite-wasm`, `kysely`, `@evolu/react-web` must be excluded from Vite dep optimization.
- **Headless Evolu in Node.js** — `createDbWorkerForPlatform` from `@evolu/common/local-first` runs in-process (no Web Workers). Use `createBetterSqliteDriver` from `@evolu/nodejs`. Node 22 has built-in `globalThis.WebSocket`. `reloadApp` must be no-op.
- **better-sqlite3 native bindings** — `npx node-gyp rebuild --directory=node_modules/better-sqlite3` after Node version change.
- **Per-user bot instances** — each TG user gets own Evolu instance + mnemonic file in `packages/bot/data/`. DB files are `bot-{userId}.db` in the bot dir.
- **@evolu/common ESM-only** — use `node --import tsx/esm` not plain `tsx` (tsx tries CJS first, fails on missing default export).

## v1 → v2 Migration

v1 used Yjs CRDT with a custom WS relay. v2 uses Evolu (SQLite CRDT). No automatic migration — tasks need to be re-created or migrated via script (read v1 REST API → insert into v2 Evolu).

## Telegram Bot (packages/bot/)

**@esbucketbot** — `pass bucket/bot-token`

- `/start <mnemonic>` — link to existing Bucket identity
- `/start new` — fresh identity, prints mnemonic to paste into web app
- Any text message → task in default 🪣 Bucket list
- Persistent keyboard: `🪣 Bucket` / `📋 Lists` / `↗️ Move`
- Inline `✅` `🗑` buttons on task lists
- Menu button opens bucket.esen.works as Mini App
- Multi-user: per-user Evolu + mnemonic in `packages/bot/data/{userId}.mnemonic`

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Web PWA | ✅ Deployed | bucket.esen.works (Railway) |
| Relay | ✅ Running | wss://relay-production-1075.up.railway.app |
| TG Bot | ✅ Running | @esbucketbot, grammY + headless Evolu |
| CLI | 🔲 Planned | Deno, reads Evolu SQLite directly |
| Pi Skill | 🔲 Planned | Wraps CLI or hits relay API |
| Mobile | 🔲 Planned | React Native + Expo, shared core |
