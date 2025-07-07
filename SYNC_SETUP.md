# TinyBase Sync Setup

## Overview

Your app now supports real-time synchronization between multiple clients using TinyBase's WebSocket synchronization with BIP39-style passphrase authentication. This allows multiple users to collaborate on the same lists and tasks in real-time, with each user having their own private space.

## How it works

- **Local-first**: App works completely offline with localStorage persistence
- **Real-time sync**: When sync server is available, changes sync instantly between clients
- **CRDT-based**: Uses Conflict-free Replicated Data Types for automatic conflict resolution
- **User isolation**: Each user has their own private data space based on their passphrase
- **BIP39 authentication**: Uses 12-word mnemonic phrases for secure, memorable authentication
- **QR code sharing**: Easy sharing of access credentials via QR codes
- **Automatic fallback**: If sync server is unavailable, app continues working locally

## Quick Start

### 1. Start the sync server

```bash
pnpm run sync-server
```

This starts a WebSocket server on `ws://localhost:8040` that handles synchronization between clients.

### 2. Start the app

```bash
pnpm run dev
```

Or run both together:

```bash
pnpm run dev:sync
```

### 3. Authentication

When you first open the app, you'll see an authentication screen:

- **🎲 Create New**: Generate a new 12-word passphrase
- **📋 Paste**: Paste an existing passphrase from clipboard
- **🚀 Enter Space**: Authenticate and enter your private space

### 4. Use the sync controls

- **🔄 Synced**: Connected and synchronizing
- **📱 Local only**: Working offline
- **👤 User ID**: Shows your unique user identifier
- **Connect button**: Click to connect to sync server
- **Disconnect button**: Click to go back to local-only mode
- **🚪 Logout**: Switch to a different user

## Files

- `src/tinybase-store.ts` - Updated to use MergeableStore with sync functions and BIP39 authentication
- `src/tinybase-hooks.ts` - Added `useSync()` and `useAuth()` hooks for sync and authentication
- `src/SyncStatus.tsx` - UI component showing sync status and user info
- `src/UserAuth.tsx` - Authentication component with passphrase generation and QR codes
- `sync-db/server.js` - WebSocket sync server with user isolation
- `sync-db/user-*.json` - Individual user data files (one per user)

## Usage

### Single User, Multiple Devices

1. **Create your space**: Generate a new passphrase on your first device
2. **Save your passphrase**: Copy the 12 words and store them securely
3. **Share via QR**: Use the QR code to easily access from other devices
4. **Sync across devices**: Your lists sync instantly between all your devices

### Multiple Users, Shared Device

1. **Each user creates their own space**: Generate unique passphrases
2. **Switch users**: Use the logout button to switch between users
3. **Private data**: Each user sees only their own lists and tasks
4. **Secure access**: No user can access another user's data

### Collaboration

1. **Share your passphrase**: Give your 12-word passphrase to collaborators
2. **Everyone uses the same passphrase**: All collaborators enter the same space
3. **Real-time sync**: Changes appear instantly for all collaborators
4. **Conflict resolution**: Multiple people can edit simultaneously without conflicts

## Server Configuration

The sync server can be configured with environment variables:

```bash
PORT=8040 pnpm run sync-server
```

## Deployment

For production, deploy the sync server to any Node.js hosting service:

1. **Heroku**: Push the `sync-db/server.js` file
2. **Railway**: Deploy the entire project
3. **Vercel**: Use serverless functions
4. **Self-hosted**: Run on any VPS with Node.js

Update the WebSocket URL in `src/tinybase-store.ts`:

```typescript
export const WS_SERVER_URL = "wss://your-server.com";
```

The server automatically handles user isolation - each user connects to their own path based on their unique user ID derived from their passphrase.

## Benefits

- **Real-time collaboration**: Multiple users can work on the same lists simultaneously
- **Private by default**: Each user has their own encrypted space
- **Memorable authentication**: BIP39 passphrases are human-readable and secure
- **Easy sharing**: QR codes make it simple to share access
- **Conflict resolution**: Automatic handling of concurrent edits
- **Offline-first**: Works without internet connection
- **Cross-device sync**: Access your data from any device
- **No accounts needed**: No email, phone, or personal info required
- **Data persistence**: Server stores data permanently
- **Simple setup**: Just start the server and connect

## Technical Details

- Uses TinyBase's `MergeableStore` for CRDT support
- BIP39 mnemonic phrases for secure, memorable authentication
- SHA-256 hashing to derive unique user IDs from passphrases
- WebSocket server handles client connections and message routing
- User isolation via unique connection paths (`ws://server/<userId>`)
- File-based persistence stores data on server (one file per user)
- Automatic conflict resolution using timestamps and client IDs
- QR code generation for easy credential sharing
- Graceful degradation when sync is unavailable
- Local storage persistence for offline-first experience

## Security Notes

- **Passphrase security**: Your 12-word passphrase is the only way to access your data
- **No password recovery**: If you lose your passphrase, your data is permanently lost
- **Client-side derivation**: User IDs are derived locally from passphrases
- **Server isolation**: Each user's data is stored in separate files on the server
- **No user tracking**: The server doesn't store personal information or track users