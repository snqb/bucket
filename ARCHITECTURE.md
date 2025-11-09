# 🪣 Bucket - Architecture Documentation

## Overview

Bucket is a minimalist multi-list todo app with real-time cross-device synchronization using passphrase-based authentication. Built with React 19, TinyBase for reactive state management, and WebSocket-based sync.

## Core Principles

- **Offline-first**: App works completely offline, syncs when connected
- **Zero-config sync**: No accounts, just memorable passphrases (BIP39 mnemonics)
- **Reactive state**: TinyBase provides automatic UI updates on data changes
- **Progressive Web App**: Installable, works like a native app

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (React)                     │
│  App.tsx → Screen.tsx → Task.tsx, Adder.tsx            │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│              State Layer (TinyBase)                     │
│  tinybase-hooks.ts (React integration)                  │
│  tinybase-store.ts (Store + Sync setup)                 │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│            Sync Layer (WebSocket)                       │
│  TinyBase WsServer synchronizer                         │
│  sync-db/server.js (Node.js + SQLite)                   │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│          Storage Layer (SQLite + LocalStorage)          │
│  Server: better-sqlite3 (persistent)                    │
│  Client: localStorage (offline cache)                   │
└─────────────────────────────────────────────────────────┘
```

## Data Model

### TinyBase Schema

```typescript
// Tables
lists: {
  [listId]: {
    id: string
    title: string
    emoji: string
    createdAt: number
    userId: string
  }
}

tasks: {
  [taskId]: {
    id: string
    listId: string
    title: string
    completed: boolean
    order: number
    createdAt: number
    deletedAt?: number
  }
}

cemetery: {
  [itemId]: {
    id: string
    originalTitle: string
    deletedAt: number
    listId: string
  }
}

// Values (singleton global state)
values: {
  userId: string
  passphrase: string
  isAuthenticated: boolean
  syncStatus: 'connected' | 'disconnected' | 'syncing' | 'error'
}
```

## Component Tree

```
App (routing + auth)
├── UserAuth (passphrase login/signup)
│   └── QR code generation for passphrases
├── Bucket (main todo view)
│   ├── Desktop: Grid layout (all lists visible)
│   │   └── Screen (per list)
│   │       ├── Task (todo item)
│   │       └── Adder (new task input)
│   └── Mobile: Single screen with navigation
│       ├── Screen (current list)
│       └── MobileListCard (grid view selector)
├── Cemetery (deleted items view)
├── SyncButton (manual sync trigger)
├── SyncStatus (connection indicator)
├── DataRecovery (export/import)
├── UserControls (settings, logout, QR)
└── ReloadPrompt (PWA update notification)
```

## Key Files Reference

### Entry Points
- `src/main.tsx` - React app bootstrap, PWA registration
- `src/App.tsx` - Main app component, routing (/, /cemetery)
- `sync-db/server.js` - WebSocket sync server

### State Management
- `src/tinybase-store.ts` - TinyBase store creation, sync setup, persistence
- `src/tinybase-hooks.ts` - React hooks for accessing store data
- `src/TinyBaseProvider.tsx` - Context provider for store

### UI Components
- `src/Screen.tsx` - Individual todo list view
- `src/Task.tsx` - Single todo item with completion toggle
- `src/Adder.tsx` - Add new task input
- `src/UserAuth.tsx` - Authentication flow
- `src/UserControls.tsx` - User settings/actions
- `src/SyncButton.tsx` - Manual sync control
- `src/SyncStatus.tsx` - Connection status indicator
- `src/DataRecovery.tsx` - Export/import functionality

### Utilities
- `src/emojis.tsx` - Emoji picker data
- `src/wordlist.ts` - BIP39 word list for passphrases
- `src/lib/utils.ts` - Tailwind class merger

## Authentication Flow

```
1. User enters/generates passphrase
   ↓
2. Derive userId from passphrase (deterministic hash)
   ↓
3. Store in localStorage: bucket-userId, bucket-passphrase
   ↓
4. Connect to WebSocket with userId
   ↓
5. Server creates/joins room for userId
   ↓
6. All devices with same passphrase → same userId → same room → synced
```

## Sync Mechanism

**TinyBase WsServer Synchronizer:**
- Client connects to WebSocket server with userId as room identifier
- Server stores data in SQLite (`data.db`)
- All changes broadcast to all clients in same room
- Automatic conflict resolution via TinyBase CRDTs
- Reconnection handled automatically

**Offline behavior:**
- All changes persist to localStorage
- Queue builds up while offline
- On reconnect, TinyBase syncs queued changes
- Server broadcasts to other connected clients

## Build & Deploy

**Development:**
```bash
pnpm install          # Install dependencies
pnpm run dev:sync     # Start both dev server + sync server
```

**Production:**
```bash
pnpm build            # Build frontend → dist/
pnpm start            # Start sync server (serves static + WebSocket)
```

**Environment:**
- Node.js 20.11.0 (via Volta)
- pnpm 9.6.0

## Testing

Test suites in `src/test/`:
- `auth.test.ts` - Authentication logic
- `data-storage.test.ts` - LocalStorage persistence
- `data-isolation-fixed.test.ts` - User data isolation
- `server-isolation.test.ts` - Server-side isolation
- `multi-device-sync.test.ts` - Cross-device sync
- `passphrase-isolation.test.ts` - Passphrase security

Run tests:
```bash
pnpm test             # Watch mode
pnpm test:run         # Single run
pnpm test:ui          # Vitest UI
```

## Security Considerations

**Passphrase-based auth:**
- No password storage on server
- userId = deterministic hash of passphrase
- Same passphrase → same userId → access to data
- Users responsible for passphrase secrecy

**Data isolation:**
- Each userId has isolated room on server
- No cross-user data access
- QR codes for easy passphrase sharing between own devices

**Recommendations:**
- Use strong, unique passphrases
- Don't share passphrases with untrusted parties
- Export data regularly via DataRecovery

## PWA Features

- **Offline support**: Service worker caches app shell
- **Installable**: Add to home screen on mobile/desktop
- **Auto-update**: ReloadPrompt notifies users of updates
- **Splash screens**: iOS splash screens in public/
- **Icons**: PWA icons (192x192, 512x512) + iOS variants

Configured via `vite-plugin-pwa` in `vite.config.ts`.

## Performance Optimizations

- **TinyBase**: Minimal re-renders, only affected components update
- **Framer Motion**: Hardware-accelerated animations
- **Lazy loading**: Route-based code splitting (Bucket, Cemetery)
- **PWA caching**: App shell cached for instant loads

## Roadmap / Future Enhancements

- [ ] End-to-end encryption for data at rest on server
- [ ] Subtasks / nested todos
- [ ] Due dates and reminders
- [ ] Tags/categories
- [ ] Search/filter
- [ ] Collaborative lists (multi-user)
- [ ] Desktop apps (Tauri)
