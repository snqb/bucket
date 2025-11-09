# 🪣 Bucket - Simple Todo Lists

A minimalist todo app that syncs across devices with passphrase-based authentication.

**Key Differentiator**: Tasks are not checkboxes - they're **progress bars** (0-100%). When you reach 100%, the task auto-deletes to the cemetery. This encourages incremental progress over binary done/not-done thinking.

## Features

- **Progress-Based Tasks**: Track incremental progress (0-100%) instead of simple checkboxes
- **Multiple Lists**: Create and manage multiple todo lists with custom emojis
- **Real-time Sync**: Changes sync instantly across all your devices via WebSocket
- **Passphrase Auth**: Simple, secure authentication using BIP39 12-word mnemonics
- **Responsive Design**: Full-screen mobile experience, grid layout on desktop
- **Cemetery**: Completed items (100% progress) move to cemetery for archival
- **Offline-First**: Works offline, syncs when reconnected (CRDT conflict resolution)
- **Progressive Web App**: Installable on mobile and desktop

## Quick Start

### Development

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   cd bucket
   pnpm install
   ```

2. **Start the sync server** (in one terminal):
   ```bash
   pnpm run server
   ```

3. **Start the app** (in another terminal):
   ```bash
   pnpm run dev
   ```

4. **Create your first list**:
   - Click "New User" to generate a 12-word passphrase
   - **Save your passphrase** - it's your only way back to your data!
   - Start creating lists and tasks

### Production Build

```bash
pnpm run build
pnpm run preview
```

## How Authentication Works

- **BIP39 Mnemonics**: 12-word passphrases (same standard as crypto wallets)
- **Deterministic User IDs**: SHA-256 hash of mnemonic seed
- **No Server Auth**: Same passphrase on any device = same user ID = same data
- **No Account Creation**: Just remember your 12 words

## Architecture

### Clean Layered Design

```
UI Layer (React)
    ↓
Application Layer (hooks)
    ↓
Domain Layer (store schema)
    ↓
Infrastructure Layer
    ├── auth.ts - BIP39 authentication
    ├── storage.ts - localStorage abstraction
    ├── sync.ts - WebSocket real-time sync
    ├── persistence.ts - TinyBase persister
    └── bucket-store.ts - Schema & CRUD
```

### Project Structure

```
src/
├── lib/
│   ├── auth.ts           # BIP39 passphrase authentication
│   ├── storage.ts        # Type-safe localStorage wrapper
│   ├── sync.ts           # WebSocket sync manager (auto-reconnect)
│   ├── persistence.ts    # TinyBase localStorage persister
│   └── bucket-store.ts   # Store schema + CRUD operations
├── components/
│   └── ui/               # shadcn/ui components
├── App.tsx               # Main app with routing
├── Screen.tsx            # Individual list view
├── Task.tsx              # Task item with progress slider
├── Adder.tsx             # Add new task component
├── UserAuth.tsx          # Auth flow (login/new user)
├── tinybase-store.ts     # Orchestration layer
└── tinybase-hooks.ts     # React hooks for data access
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **State Management**: [TinyBase](https://tinybase.org) (5-13kB reactive CRDT store)
- **Sync**: WebSocket with TinyBase WS Synchronizer (automatic CRDT merging)
- **Auth**: [@scure/bip39](https://github.com/paulmillr/scure-bip39) for mnemonic generation
- **Animation**: Framer Motion
- **UI Components**: Radix UI + shadcn/ui
- **Build**: Vite + PWA plugin
- **Server**: Node.js + ws (WebSocket server)

## Data Model

### Tables

**lists**
- `id`: Unique identifier
- `title`: List name
- `emoji`: Display emoji (default: 📋)
- `color`: Theme color (default: #3B82F6)
- `createdAt`: Timestamp

**tasks**
- `id`: Unique identifier
- `listId`: Foreign key to lists
- `title`: Task description
- `description`: Optional details
- `progress`: 0-100 (not a boolean!)
- `completed`: Auto-set to true at 100%
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**cemetery**
- `id`: Unique identifier
- `originalTitle`: Task title before deletion
- `originalDescription`: Task description
- `originalProgress`: Final progress value
- `deletedAt`: Timestamp
- `deletionReason`: "completed" | "deleted" | "list deleted"

### Why TinyBase?

1. **Small**: 5-13kB total (perfect for watch apps)
2. **CRDT Built-in**: Automatic conflict resolution for offline sync
3. **Reactive**: UI updates automatically on data changes
4. **Mergeable**: Built-in support for multi-device sync
5. **TypeScript**: Full type safety

## Development

### Commands

```bash
pnpm run dev      # Start dev server (http://localhost:5173)
pnpm run server   # Start sync server (ws://localhost:8040)
pnpm run build    # Production build
pnpm run preview  # Preview production build
pnpm run lint     # Run ESLint
```

### Sync Server

The sync server (`sync-db/server.js`) is a simple WebSocket server that:
- Stores data in SQLite (one table per user)
- Broadcasts changes to all connected clients
- Handles CRDT merges automatically via TinyBase

**Production**: Deploy to Railway with automatic WebSocket support

### Adding New Features

1. **New Table**: Add to `src/lib/bucket-store.ts` schema
2. **New UI**: Create component in `src/components/`
3. **New Hook**: Add to `src/tinybase-hooks.ts`
4. **New Route**: Update `src/App.tsx`

## Deployment

### Frontend (Vercel/Netlify)

```bash
pnpm run build
# Deploy dist/ folder
```

### Sync Server (Railway)

1. Push to GitHub
2. Connect Railway to repo
3. Set start command: `node sync-db/server.js`
4. Railway auto-detects WebSocket support

### Environment Variables

**Frontend** (`.env`):
```
VITE_WS_SERVER_URL=wss://your-server.railway.app
```

**Server** (Railway):
```
PORT=8080  # Railway auto-sets this
```

## Security Considerations

⚠️ **Important**: This is an MVP - passphrase-based auth is simple but has limitations:

- **No Password Recovery**: Lose your 12 words = lose your data
- **No Access Control**: Anyone with your passphrase = full access
- **No Encryption**: Data stored in plain text on server
- **Single User ID**: Same passphrase = same user (can't have multiple accounts)

**For Production**:
- Add server-side authentication (OAuth, email/password)
- Encrypt data at rest on server
- Add end-to-end encryption for sensitive data
- Implement rate limiting on sync server
- Add passphrase strength requirements

## Contributing

PRs welcome! This is an open-source learning project.

## License

MIT

---

**Built with ❤️ as a minimal, functional todo app focused on progress over completion**
