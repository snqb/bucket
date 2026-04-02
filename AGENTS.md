<!-- Updated: 2026-04-03 -->
# bucket v2

> Progress bars, not checkboxes. Local-first PWA powered by Evolu.

## Architecture

```
packages/core/     Evolu schema, queries, branded types (shared)
packages/web/      Vite + React + Tailwind 4 PWA
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
                                  ↕
                            relay disk (./data/*.db)
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
```

## Gotchas

- **Top-level await in evolu.ts** — `localAuth.getOwner()` is async. Vite handles TLA fine, but SSR would break.
- **exactOptionalPropertyTypes** — required by Evolu. Config objects must use spread, not mutation.
- **Soft delete** — `isDeleted` flag, not actual DELETE. All queries must filter `.where("isDeleted", "is not", sqliteTrue)`.
- **Progress is NonNegativeInt** — clamped 0–100 in UI, but schema allows any non-negative int. Validate in app layer.
- **optimizeDeps.exclude** — `@evolu/sqlite-wasm`, `kysely`, `@evolu/react-web` must be excluded from Vite dep optimization.

## v1 → v2 Migration

v1 used Yjs CRDT with a custom WS relay. v2 uses Evolu (SQLite CRDT). No automatic migration — tasks need to be re-created or migrated via script (read v1 REST API → insert into v2 Evolu).

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Web PWA | ✅ Working | Vite dev, needs deploy setup |
| Relay | ✅ Scaffolded | Docker-ready, Railway deploy |
| CLI | 🔲 Planned | Deno, reads Evolu SQLite directly |
| Pi Skill | 🔲 Planned | Wraps CLI or hits relay API |
| Mobile | 🔲 Planned | React Native + Expo, shared core |
