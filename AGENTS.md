<!-- Updated: 2026-03-05 -->
# bucket

> Progress bars, not checkboxes. Offline-first PWA with real-time sync.

## How It Works

```
browser → IndexedDB (offline) → Y.Doc ←→ WebSocket relay ←→ other devices
                                  ↕
                            server disk (./data/*.yjs)
```

- **Yjs CRDT** for conflict-free sync. Each task/list is a **nested Y.Map** — concurrent edits to different fields merge without data loss.
- **Room ID = identity**. No auth. 16-char alphanumeric string. Share via QR or paste.
- **3-layer persistence**: IndexedDB (instant), WebSocket (real-time), server disk (durable). Devices never need simultaneous connection.

## Files

| File | Lines | What |
|------|-------|------|
| `src/store.ts` | 212 | Yjs doc, nested Y.Maps, CRUD, subscriptions, connect/disconnect |
| `src/app.tsx` | 569 | All UI: TaskBar, ListPanel, QR scanner/modal, PWA install, RoomSetup |
| `src/hooks.ts` | 19 | `useStore(selector)` and `useToggle` |
| `src/main.tsx` | 20 | Mount + SW registration + update prompt |
| `server.js` | 381 | Yjs WS relay, disk persistence, rate limiting, daily backups |

## Gotchas

- **Nested Y.Maps, not plain objects.** `yTasks.set(id, ymap)` where ymap is `new Y.Map()`. Using `yTasks.set(id, plainObj)` silently breaks CRDT — becomes last-writer-wins. Always use `setFields()` helper in store.ts.
- **Server broadcast pattern.** Each WS connection registers its own `doc.on("update")` listener that sends to **that one ws only** (not iterating peers). The `origin === ws` check skips the sender. Getting this wrong causes updates to echo back instead of relaying.
- **`touch-none` on progress bars.** Bars use `onTouchStart/Move/End` directly. `touch-action: none` prevents scroll interference during swipe-to-set-progress. Removing it breaks mobile.
- **QR encodes a URL**, not raw room ID: `https://bucket.esen.works?join=ROOMID`. The `RoomSetup` component auto-joins from `?join=` param and strips it from URL.
- **Railway volume at `/data`**. Server persists room docs there. Dockerfiles must NOT use `VOLUME` directive (Railway bans it).
- **`pnpm.onlyBuiltDependencies`** in package.json — needed for esbuild to build on Railway.

## Recipes

### Deploy
```bash
# Both services (web is linked by default)
railway up -d                                    # web
railway up -d -s 75f79f82-7a68-40ba-84f1-83a17949ba85  # sync
```

### Run locally
```bash
node server.js                # sync server :8040
pnpm dev                      # vite :4999
```

### Add a new task field
1. Add to `Task` type in `store.ts`
2. Add default in `createTask()` — set on the nested Y.Map via `setFields()`
3. Read in `app.tsx` — comes from `ymapToObj<Task>()`
4. Update via `updateTask(id, { newField: value })` — sets individual key on Y.Map

## Infrastructure

| Service | URL | Railway ID |
|---------|-----|-----------|
| Web (nginx) | bucket.esen.works | `0044ef10-9dfe-490f-9f5f-533abed8d1e5` |
| Sync (node) | bucket-sync.esen.works | `75f79f82-7a68-40ba-84f1-83a17949ba85` |
| Project | — | `a4828126-b51e-4807-9743-98f5d3e64e11` |
| DNS | Porkbun | CNAME + TXT `_railway-verify.*` |

Server limits: 200 global conns, 5/IP, 10 new/min/IP. Daily backups with 7-day retention in `data/backups/`.
