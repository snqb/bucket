# Bucket Project Structure

## Project Type
React 19 + TypeScript PWA todo app with TinyBase state management and WebSocket sync.

## Key Technologies
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **State**: TinyBase (reactive CRDT-based state management)
- **Sync**: WebSocket (Node.js server with SQLite)
- **Auth**: BIP39 passphrase-based (no accounts)
- **UI**: shadcn/ui components + Framer Motion
- **PWA**: vite-plugin-pwa + Workbox

## Directory Structure

```
bucket/
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main component with routing
│   ├── TinyBaseProvider.tsx      # TinyBase context provider
│   ├── tinybase-store.ts         # Store setup + sync config
│   ├── tinybase-hooks.ts         # React hooks for data access
│   │
│   ├── Screen.tsx                # Individual list view
│   ├── Task.tsx                  # Todo item component
│   ├── Adder.tsx                 # New task input
│   │
│   ├── UserAuth.tsx              # Passphrase auth
│   ├── UserControls.tsx          # Settings/logout
│   ├── DataRecovery.tsx          # Export/import
│   ├── SyncButton.tsx            # Manual sync
│   ├── SyncStatus.tsx            # Connection indicator
│   ├── ReloadPrompt.tsx          # PWA update prompt
│   │
│   ├── emojis.tsx                # Emoji data
│   ├── wordlist.ts               # BIP39 words
│   ├── sw.ts                     # Service worker
│   ├── index.css                 # Global styles
│   │
│   ├── components/ui/            # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── slider.tsx
│   │   └── progress.tsx
│   │
│   ├── lib/
│   │   └── utils.ts              # Tailwind cn() helper
│   │
│   └── test/                     # Vitest test suites
│       ├── setup.ts
│       ├── auth.test.ts
│       ├── data-storage.test.ts
│       ├── data-isolation-fixed.test.ts
│       ├── server-isolation.test.ts
│       ├── multi-device-sync.test.ts
│       └── passphrase-isolation.test.ts
│
├── sync-db/                      # WebSocket sync server
│   ├── server.js                 # Node.js + SQLite server
│   ├── package.json              # Server dependencies
│   └── railway.json              # Railway deployment config
│
├── public/                       # PWA assets
│   ├── index.html
│   ├── pwa-*.png                 # PWA icons
│   ├── apple-*.png/.jpg          # iOS assets
│   ├── bucket.png                # Logo
│   └── robots.txt
│
├── @types/                       # TypeScript declarations
│   ├── pwa-register.d.ts
│   └── emoji-from-text.d.ts
│
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite + PWA config
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── components.json               # shadcn/ui config
├── README.md                     # Quick start guide
└── ARCHITECTURE.md               # Detailed architecture docs
```

## Data Flow

1. **User interaction** → React component
2. **Component calls** → action from `tinybase-hooks.ts`
3. **Action updates** → TinyBase store in `tinybase-store.ts`
4. **TinyBase triggers** → WebSocket sync to server
5. **Server broadcasts** → to all connected clients with same userId
6. **Other clients receive** → update their local TinyBase stores
7. **TinyBase notifies** → React components via hooks
8. **Components re-render** → UI updates automatically

## Important Patterns

### State Management
- All state lives in TinyBase store (no React state for data)
- Components use hooks from `tinybase-hooks.ts`: `useLists()`, `useListTasks()`, `useActions()`
- Actions return from hooks modify store directly
- TinyBase handles React re-renders automatically

### Routing
- Uses `wouter` for routing (lightweight alternative to react-router)
- Routes: `/` (main todo view), `/cemetery` (deleted items)

### Authentication
- Passphrase-based, no server-side accounts
- userId = deterministic hash of passphrase
- Stored in localStorage: `bucket-userId`, `bucket-passphrase`
- Same passphrase = same userId = access to same data across devices

### Sync
- TinyBase WsServer synchronizer handles all sync logic
- Automatic reconnection on network changes
- Offline changes queued and synced on reconnect
- CRDTs prevent conflicts

### Testing
- Vitest + Testing Library
- Focus on data isolation and sync correctness
- Run with `pnpm test`

## Code Conventions

- **Component files**: PascalCase (e.g., `UserAuth.tsx`)
- **Utility files**: kebab-case (e.g., `tinybase-hooks.ts`)
- **Export default**: for components
- **Export named**: for utilities/hooks
- **Tailwind**: Use `cn()` from `lib/utils.ts` for conditional classes
- **Types**: Inline or imported from TinyBase schemas

## Common Tasks

**Add new list:**
```typescript
actions.createList("List Name")
```

**Add task to list:**
```typescript
actions.addTask(listId, "Task title")
```

**Update task:**
```typescript
actions.updateTask(taskId, { completed: true })
```

**Delete list:**
```typescript
actions.deleteList(listId)  // Moves tasks to cemetery
```

## Development

```bash
# Start dev server + sync server
pnpm run dev:sync

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:ui
```

## Deployment
Designed for Railway deployment with automatic builds on git push.
