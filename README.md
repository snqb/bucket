# 🪣 Bucket - Simple Todo Lists

A minimalist todo app that syncs across devices with passphrase-based authentication.

## Features

- **Multiple Lists**: Create and manage multiple todo lists with custom emojis
- **Real-time Sync**: Changes sync instantly across all your devices
- **Passphrase Auth**: Simple, secure authentication using memorable passphrases
- **Responsive Design**: Full-screen experience on mobile, grid layout on desktop
- **Cemetery**: Deleted items are preserved in a cemetery view
- **Offline Support**: Works offline with automatic sync when reconnected

## Quick Start

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   cd bucket
   pnpm install
   ```

2. **Start the sync server**:
   ```bash
   pnpm run server
   ```

3. **Start the app**:
   ```bash
   pnpm run dev
   ```

4. **Create your first list**: Enter a passphrase to get started

## How it works

- **Lists**: Each list has a title, emoji, and collection of todos
- **Sync**: Your data syncs across devices using the same passphrase
- **Mobile**: Single list view with navigation arrows and grid toggle
- **Desktop**: Grid view showing all lists simultaneously
- **Storage**: Data persists locally and syncs via WebSocket server

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **State**: TinyBase (reactive data store)
- **Sync**: WebSocket-based real-time synchronization
- **Auth**: BIP39 mnemonic passphrases
- **Animation**: Framer Motion

## Project Structure

```
src/
├── App.tsx           # Main app component with routing
├── Screen.tsx        # Individual todo list component
├── Task.tsx          # Single todo item component
├── Adder.tsx         # Add new todo component
├── UserAuth.tsx      # Authentication component
├── tinybase-store.ts # Data store and sync logic
└── tinybase-hooks.ts # React hooks for data access
```

## Development

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run server` - Start sync server
- `pnpm run preview` - Preview production build

## License

MIT