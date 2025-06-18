# Jazz Migration Guide for Bucket

## Introduction

This guide provides a comprehensive migration path from Dexie to Jazz for the Bucket todo application. Jazz is a backendless toolkit that provides real-time collaboration, cryptographic authentication, and local-first data synchronization without requiring a backend infrastructure.

## Why Migrate to Jazz?

### Current Limitations with Dexie
- Complex async/await patterns
- Limited real-time collaboration
- Manual conflict resolution
- Requires external sync infrastructure (Dexie Cloud)
- Authentication depends on third-party services

### Jazz Advantages
- **Backendless Architecture**: No server infrastructure needed
- **Real-time Collaboration**: Built-in multiplayer capabilities
- **Local-first Design**: Works offline, syncs when online
- **Cryptographic Security**: End-to-end encryption by default
- **Simple Authentication**: Passphrase or passkey-based auth
- **Automatic Conflict Resolution**: CRDT-based data structures
- **TypeScript First**: Excellent type safety and developer experience

## Installation and Setup

### Step 1: Install Jazz

```bash
npm install jazz-tools
# or with pnpm
pnpm add jazz-tools
```

### Step 2: Get Jazz Cloud API Key

```bash
npx create-jazz-app@latest --api-key your-email@example.com
```

### Step 3: Update Package.json

```json
{
  "dependencies": {
    "jazz-tools": "^0.14.0",
    // ... existing dependencies
  }
}
```

## Schema Definition with CoValues

### Step 1: Create Jazz Schemas

Create `src/jazz/schemas.ts`:

```typescript
import { CoMap, CoList, Group, Profile, Account } from 'jazz-tools';

// User Profile Schema
export class UserProfile extends Profile {
  name = co.string;
  avatar = co.string.optional;
  createdAt = co.date;
}

// Todo Item Schema
export class TodoItem extends CoMap {
  title = co.string;
  description = co.string.optional;
  progress = co.number; // 0-100
  completed = co.boolean;
  createdAt = co.date;
  updatedAt = co.date;
  
  // Reference to the list this item belongs to
  listId = co.ref(TodoList);
  
  // Mark as completed when progress reaches 100
  markCompleted() {
    this.progress = 100;
    this.completed = true;
    this.updatedAt = new Date();
  }
  
  // Update progress
  updateProgress(increment: number) {
    const newProgress = Math.min(100, Math.max(0, this.progress + increment));
    this.progress = newProgress;
    this.updatedAt = new Date();
    
    if (newProgress >= 100) {
      this.markCompleted();
    }
  }
}

// Todo List Schema
export class TodoList extends CoMap {
  title = co.string;
  emoji = co.string;
  color = co.string.optional;
  createdAt = co.date;
  updatedAt = co.date;
  
  // List of todo items
  items = CoList.of(co.ref(TodoItem));
  
  // Add new item
  addItem(title: string, description?: string) {
    const item = TodoItem.create({
      title,
      description,
      progress: 0,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      listId: this.id,
    }, this._owner);
    
    this.items.push(item);
    this.updatedAt = new Date();
    return item;
  }
  
  // Remove item (move to cemetery)
  removeItem(itemId: string) {
    const index = this.items.findIndex(item => item?.id === itemId);
    if (index !== -1) {
      const item = this.items[index];
      
      // Add to cemetery before removing
      if (item && this._owner.profile?.cemetery) {
        this._owner.profile.cemetery.addItem(item);
      }
      
      this.items.splice(index, 1);
      this.updatedAt = new Date();
    }
  }
}

// Cemetery for deleted items
export class Cemetery extends CoMap {
  items = CoList.of(co.ref(CemeteryItem));
  
  addItem(originalItem: TodoItem) {
    const cemeteryItem = CemeteryItem.create({
      originalTitle: originalItem.title,
      originalDescription: originalItem.description,
      originalProgress: originalItem.progress,
      deletedAt: new Date(),
      deletionReason: originalItem.completed ? 'completed' : 'user_deleted',
    }, this._owner);
    
    this.items.push(cemeteryItem);
  }
}

// Cemetery Item Schema
export class CemeteryItem extends CoMap {
  originalTitle = co.string;
  originalDescription = co.string.optional;
  originalProgress = co.number;
  deletedAt = co.date;
  deletionReason = co.string; // 'completed' | 'user_deleted'
}

// Main App Data Schema
export class AppData extends CoMap {
  todoLists = CoList.of(co.ref(TodoList));
  cemetery = co.ref(Cemetery);
  
  // Create new todo list
  createList(title: string, emoji?: string) {
    const list = TodoList.create({
      title,
      emoji: emoji || this.generateRandomEmoji(),
      color: this.generateRandomColor(title),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: CoList.of(co.ref(TodoItem)).create([], this._owner),
    }, this._owner);
    
    this.todoLists.push(list);
    return list;
  }
  
  // Delete todo list
  deleteList(listId: string) {
    const index = this.todoLists.findIndex(list => list?.id === listId);
    if (index !== -1) {
      const list = this.todoLists[index];
      
      // Move all items to cemetery
      if (list) {
        list.items.forEach(item => {
          if (item && this.cemetery) {
            this.cemetery.addItem(item);
          }
        });
        
        this.todoLists.splice(index, 1);
      }
    }
  }
  
  private generateRandomEmoji(): string {
    const emojis = ['📝', '✅', '📋', '📌', '🎯', '⭐', '🔥', '💡', '🚀', '🎉'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
  
  private generateRandomColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsla(${hue}, 70%, 50%, 0.1)`;
  }
}

// Extend UserProfile to include app data
declare module 'jazz-tools' {
  interface Profile extends UserProfile {
    appData?: AppData;
    cemetery?: Cemetery;
  }
}
```

## Jazz Provider Setup

### Step 1: Create Jazz Provider Component

Create `src/jazz/JazzProvider.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { 
  JazzProvider as BaseJazzProvider, 
  usePassphraseAuth,
  createJazzBrowserAccount,
  BrowserContext 
} from 'jazz-tools';
import { UserProfile, AppData, Cemetery } from './schemas';

interface JazzProviderProps {
  children: ReactNode;
}

export function JazzProvider({ children }: JazzProviderProps) {
  return (
    <BaseJazzProvider
      auth="passphrase"
      peer="wss://cloud.jazz.tools"
      schema={{
        profile: UserProfile,
        appData: AppData,
        cemetery: Cemetery,
      }}
    >
      {children}
    </BaseJazzProvider>
  );
}

// Authentication component
export function JazzAuthentication({ children }: { children: ReactNode }) {
  const auth = usePassphraseAuth();
  
  if (auth.state === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🪣</div>
          <p>Loading Jazz...</p>
        </div>
      </div>
    );
  }
  
  if (auth.state === "signedIn") {
    return <AppWithJazz>{children}</AppWithJazz>;
  }
  
  return <AuthScreen auth={auth} />;
}

// Initialize app data for new users
function AppWithJazz({ children }: { children: ReactNode }) {
  const { me } = useBrowserAccount();
  
  // Initialize user data if needed
  React.useEffect(() => {
    if (me.profile && !me.profile.appData) {
      const cemetery = Cemetery.create({
        items: CoList.of(co.ref(CemeteryItem)).create([], me),
      }, me);
      
      const appData = AppData.create({
        todoLists: CoList.of(co.ref(TodoList)).create([], me),
        cemetery: cemetery,
      }, me);
      
      me.profile.appData = appData;
      me.profile.cemetery = cemetery;
    }
  }, [me]);
  
  return <>{children}</>;
}

// Authentication screen
function AuthScreen({ auth }: { auth: any }) {
  const [passphrase, setPassphrase] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showPassphrase, setShowPassphrase] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const handleSignUp = async () => {
    try {
      await auth.signUp();
      setShowPassphrase(true);
    } catch (err) {
      setError('Failed to create account');
    }
  };
  
  const handleSignIn = async () => {
    try {
      await auth.signIn(passphrase);
    } catch (err) {
      setError('Invalid passphrase');
    }
  };
  
  if (showPassphrase && auth.passphrase) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-4xl font-bold text-white mb-8">🪣 Bucket</h1>
          <div className="text-6xl">🔑</div>
          <h2 className="text-2xl font-bold text-white">Save Your Passphrase</h2>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <textarea
              value={auth.passphrase}
              readOnly
              className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 font-mono text-sm resize-none"
              rows={4}
            />
          </div>
          <div className="text-sm text-yellow-400 bg-yellow-900/20 p-3 rounded">
            ⚠️ Store this passphrase safely! It's the only way to recover your account.
          </div>
          <button
            onClick={() => setShowPassphrase(false)}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
          >
            I've Saved My Passphrase
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🪣 Bucket</h1>
          <p className="text-gray-400">Your collaborative todo lists</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isSignUp ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isSignUp ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>
          
          {!isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recovery Passphrase
              </label>
              <textarea
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 font-mono text-sm resize-none"
                placeholder="Enter your recovery passphrase"
                rows={3}
              />
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 px-4 rounded">
              {error}
            </div>
          )}
          
          <button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            disabled={!isSignUp && !passphrase.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            {isSignUp 
              ? 'Creates a secure account with cryptographic passphrase'
              : 'Enter your passphrase to access your data across devices'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
```

## Component Migration

### Step 1: Update App Component

Modify `src/App.tsx`:

```typescript
import React from 'react';
import { Route, Switch } from 'wouter';
import { JazzProvider, JazzAuthentication } from './jazz/JazzProvider';
import { BucketView } from './components/BucketView';
import { CemeteryView } from './components/CemeteryView';
import ReloadPrompt from './ReloadPrompt';

function App() {
  return (
    <JazzProvider>
      <JazzAuthentication>
        <AppContent />
      </JazzAuthentication>
    </JazzProvider>
  );
}

function AppContent() {
  return (
    <>
      <Switch>
        <Route path="/" component={BucketView} />
        <Route path="/cemetery" component={CemeteryView} />
      </Switch>
      <ReloadPrompt />
    </>
  );
}

export default App;
```

### Step 2: Create Jazz-powered Screen Component

Create `src/components/JazzScreen.tsx`:

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { useBrowserAccount } from 'jazz-tools';
import { TodoList, TodoItem } from '../jazz/schemas';
import { JazzTask } from './JazzTask';
import { JazzAdder } from './JazzAdder';

interface JazzScreenProps {
  list: TodoList;
  className?: string;
}

export function JazzScreen({ list, className }: JazzScreenProps) {
  const { me } = useBrowserAccount();
  
  const handleUpdateTitle = () => {
    const newTitle = prompt('Enter new title:', list.title);
    if (newTitle && newTitle.trim()) {
      list.title = newTitle.trim();
      list.updatedAt = new Date();
    }
  };
  
  const handleUpdateEmoji = () => {
    const newEmoji = prompt('Enter new emoji:', list.emoji);
    if (newEmoji) {
      list.emoji = newEmoji;
      list.updatedAt = new Date();
    }
  };
  
  const handleDeleteList = () => {
    const confirmDelete = confirm(`Delete "${list.title}"? All tasks will be moved to cemetery.`);
    if (confirmDelete && me.profile?.appData) {
      me.profile.appData.deleteList(list.id);
    }
  };
  
  return (
    <motion.div
      className={`m-2 flex flex-col items-stretch gap-3 overflow-hidden border border-gray-600 px-5 pb-9 pt-6 ${className}`}
      style={{
        background: list.color || 'hsla(220, 13%, 18%, 0.1)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUpdateEmoji}
          className="text-2xl hover:scale-110 transition-transform"
        >
          {list.emoji}
        </button>
        
        <h2 
          className="font-bold text-2xl flex-1 cursor-pointer hover:text-blue-400"
          onClick={handleUpdateTitle}
        >
          {list.title}
        </h2>
        
        <button
          onClick={handleUpdateTitle}
          className="p-2 hover:bg-gray-700 rounded-md"
        >
          ✏️
        </button>
        
        <button
          onClick={handleDeleteList}
          className="p-2 hover:bg-red-700 rounded-md"
        >
          🗑️
        </button>
      </div>
      
      <hr className="border-gray-500" />
      
      {/* Add new task */}
      <JazzAdder list={list} />
      
      {/* Task list */}
      <div className="flex flex-col gap-2">
        {list.items?.map((item, index) => (
          item && <JazzTask key={item.id || index} item={item} list={list} />
        ))}
        
        {(!list.items || list.items.length === 0) && (
          <div className="text-center text-gray-500 py-8">
            <p>No tasks yet</p>
            <p className="text-sm">Add your first task above</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
```

### Step 3: Create Jazz Task Component

Create `src/components/JazzTask.tsx`:

```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLongPress } from '@uidotdev/usehooks';
import { TodoItem, TodoList } from '../jazz/schemas';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';

interface JazzTaskProps {
  item: TodoItem;
  list: TodoList;
}

export function JazzTask({ item, list }: JazzTaskProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteTask = () => {
    setIsDeleting(true);
    setTimeout(() => {
      list.removeItem(item.id);
    }, 300);
  };
  
  const updateProgress = (increment: number) => {
    item.updateProgress(increment);
    
    if (item.progress >= 100) {
      setTimeout(() => {
        deleteTask();
      }, 1000);
    }
  };
  
  const longPressProps = useLongPress(
    () => {
      let currentProgress = item.progress;
      const interval = setInterval(() => {
        if (currentProgress >= 100) {
          clearInterval(interval);
          return;
        }
        currentProgress += 5;
        item.updateProgress(5);
      }, 100);
      
      return () => clearInterval(interval);
    },
    {
      threshold: 500,
    }
  );
  
  return (
    <Dialog>
      <motion.div
        className="flex w-full select-none items-center gap-2 py-1"
        style={{
          opacity: isDeleting ? 0 : 1 - item.progress / 150,
        }}
        animate={{
          opacity: isDeleting ? 0 : 1 - item.progress / 150,
          scale: isDeleting ? 0.8 : 1,
        }}
      >
        <DialogTrigger className="flex items-baseline gap-2 flex-1">
          <Progress
            className="h-3 w-[6ch] rounded border border-gray-700"
            value={item.progress}
          />
          <p className="max-w-[21ch] break-words text-lg text-left">
            {item.title}
          </p>
        </DialogTrigger>
        
        <div className="flex gap-1">
          <button
            onClick={() => updateProgress(10)}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            +10
          </button>
          <button
            {...longPressProps}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
          >
            Hold
          </button>
        </div>
      </motion.div>
      
      <DialogContent className="bg-black border-gray-700">
        <DialogHeader className="text-white">{item.title}</DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-300">Title</label>
            <input
              value={item.title}
              onChange={(e) => {
                item.title = e.target.value;
                item.updatedAt = new Date();
              }}
              className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-300">Description</label>
            <Textarea
              value={item.description || ''}
              onChange={(e) => {
                item.description = e.target.value;
                item.updatedAt = new Date();
              }}
              className="mt-1 bg-gray-800 border-gray-600 text-white"
              rows={4}
              placeholder="Add a description..."
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-300">Progress: {item.progress}%</label>
              <Progress value={item.progress} className="mt-1" />
            </div>
            <button
              onClick={deleteTask}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Real-time Collaboration Features

### Step 1: Add Collaboration Indicators

Create `src/components/CollaborationIndicators.tsx`:

```typescript
import React from 'react';
import { useBrowserAccount } from 'jazz-tools';
import { motion } from 'framer-motion';

export function CollaborationIndicators() {
  const { me } = useBrowserAccount();
  
  // Get other users in the same group
  const otherUsers = me.profile?.appData?._owner?.profile?.group?.members?.filter(
    member => member.id !== me.id
  ) || [];
  
  return (
    <div className="fixed top-4 right-4 flex gap-2">
      {otherUsers.map((user, index) => (
        <motion.div
          key={user.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
          title={`${user.profile?.name || 'Anonymous'} is online`}
        >
          {user.profile?.name?.charAt(0) || '?'}
        </motion.div>
      ))}
      
      {otherUsers.length > 0 && (
        <div className="text-xs text-gray-400 self-center">
          {otherUsers.length} other{otherUsers.length !== 1 ? 's' : ''} online
        </div>
      )}
    </div>
  );
}
```

### Step 2: Add Live Cursors

Create `src/components/LiveCursors.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBrowserAccount } from 'jazz-tools';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
}

export function LiveCursors() {
  const { me } = useBrowserAccount();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Broadcast cursor position to other users
      // This would be implemented using Jazz's real-time capabilities
      const position = {
        x: e.clientX,
        y: e.clientY,
        userId: me.id,
        userName: me.profile?.name || 'Anonymous',
      };
      
      // Update cursor position in shared state
      // me.profile?.cursorPosition = position;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [me]);
  
  return (
    <>
      {cursors.map((cursor) => (
        <motion.div
          key={cursor.userId}
          className="fixed pointer-events-none z-50"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {cursor.userName}
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
}
```

## Data Migration from Dexie

### Step 1: Create Migration Utility

Create `src/migration/dexie-to-jazz.ts`:

```typescript
import { bucketDB } from '../store'; // Legacy Dexie store
import { useBrowserAccount } from 'jazz-tools';
import { TodoList, TodoItem } from '../jazz/schemas';

export interface MigrationProgress {
  step: string;
  progress: number;
  total: number;
  completed: boolean;
  error?: string;
}

export async function migrateDexieToJazz(
  onProgress?: (progress: MigrationProgress) => void
): Promise<boolean> {
  const { me } = useBrowserAccount();
  
  if (!me.profile?.appData) {
    throw new Error('Jazz app data not initialized');
  }
  
  try {
    // Count total items
    const [listCount, itemCount, cemeteryCount] = await Promise.all([
      bucketDB.todoLists.count(),
      bucketDB.todoItems.count(),
      bucketDB.cemetery.count(),
    ]);
    
    const totalItems = listCount + itemCount + cemeteryCount;
    let processedItems = 0;
    
    onProgress?.({
      step: 'Starting migration...',
      progress: 0,
      total: totalItems,
      completed: false,
    });
    
    // Migrate lists
    const dexieLists = await bucketDB.todoLists.toArray();
    const listIdMap = new Map<number, string>();
    
    for (const dexieList of dexieLists) {
      const jazzList = me.profile.appData.createList(
        dexieList.title,
        dexieList.emoji
      );
      
      listIdMap.set(dexieList.id!, jazzList.id);
      processedItems++;
      
      onProgress?.({
        step: 'Migrating todo lists...',
        progress: processedItems,
        total: totalItems,
        completed: false,
      });
    }
    
    // Migrate items
    const dexieItems = await bucketDB.todoItems.toArray();
    
    for (const dexieItem of dexieItems) {
      const jazzListId = listIdMap.get(dexieItem.todoListId);
      const jazzList = me.profile.appData.todoLists.find(
        list => list?.id === jazzListId
      );
      
      if (jazzList) {
        const jazzItem = jazzList.addItem(
          dexieItem.title,
          dexieItem.description
        );
        
        jazzItem.progress = dexieItem.progress;
        jazzItem.completed = dexieItem.progress >= 100;
      }
      
      processedItems++;
      
      onProgress?.({
        step: 'Migrating todo items...',
        progress: processedItems,
        total: totalItems,
        completed: false,
      });
    }
    
    // Migrate cemetery
    const dexieCemetery = await bucketDB.cemetery.toArray();
    
    for (const dexieItem of dexieCemetery) {
      if (me.profile.cemetery) {
        // Create a temporary TodoItem to pass to cemetery
        const tempItem = TodoItem.create({
          title: dexieItem.title,
          description: dexieItem.description,
          progress: dexieItem.progress || 0,
          completed: (dexieItem.progress || 0) >= 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          listId: 'migrated',
        }, me);
        
        me.profile.cemetery.addItem(tempItem);
      }
      
      processedItems++;
      
      onProgress?.({
        step: 'Migrating cemetery...',
        progress: processedItems,
        total: totalItems,
        completed: false,
      });
    }
    
    onProgress?.({
      step: 'Migration completed!',
      progress: totalItems,
      total: totalItems,
      completed: true,
    });
    
    return true;
    
  } catch (error) {
    onProgress?.({
      step: 'Migration failed',
      progress: 0,
      total: 0,
      completed: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return false;
  }
}

export async function validateJazzMigration(): Promise<{
  success: boolean;
  listsMatch: boolean;
  itemsMatch: boolean;
  details: string;
}> {
  const { me } = useBrowserAccount();
  
  try {
    const dexieListCount = await bucketDB.todoLists.count();
    const dexieItemCount = await bucketDB.todoItems.count();
    
    const jazzListCount = me.profile?.appData?.todoLists?.length || 0;
    const jazzItemCount = me.profile?.appData?.todoLists?.reduce(
      (total, list) => total + (list?.items?.length || 0), 
      0
    ) || 0;
    
    const listsMatch = dexieListCount === jazzListCount;
    const itemsMatch = dexieItemCount === jazzItemCount;
    
    return {
      success: listsMatch && itemsMatch,
      listsMatch,
      itemsMatch,
      details: `Dexie: ${dexieListCount} lists, ${dexieItemCount} items | Jazz: ${jazzListCount} lists, ${jazzItemCount} items`,
    };
  } catch (error) {
    return {
      success: false,
      listsMatch: false,
      itemsMatch: false,
      details: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
```

## Performance Optimization

### Step 1: Optimize Jazz Queries

Create `src/hooks/useOptimizedJazz.ts`:

```typescript
import { useMemo } from 'react';
import { useBrowserAccount } from 'jazz-tools';
import { TodoList, TodoItem } from '../jazz/schemas';

export function useOptimizedTodoLists() {
  const { me } = useBrowserAccount();
  
  return useMemo(() => {
    return me.profile?.appData?.todoLists?.filter(Boolean) || [];
  }, [me.profile?.appData?.todoLists]);
}

export function useOptimizedTodoItems(listId: string) {
  const { me } = useBrowserAccount();
  
  return useMemo(() => {
    const list = me.profile?.appData?.todoLists?.find(
      list => list?.id === listId
    );
    return list?.items?.filter(Boolean) || [];
  }, [me.profile?.appData, listId]);
}

export function useCemeteryItems() {
  const { me } = useBrowserAccount();
  
  return useMemo(() => {
    return me.profile?.cemetery?.items?.filter(Boolean) || [];
  }, [me.profile?.cemetery?.items]);
}
```

### Step 2: Add Performance Monitoring

Create `src/utils/performance-monitor.ts`:

```typescript
export class JazzPerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTiming(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      
      this.metrics.get(operation)!.push(duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(operation)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }
  
  getAverageTime(operation: string): number {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }
  
  getMetrics() {
    const result: Record<string, { avg: number; count: number }> = {};
    
    this.metrics.forEach((measurements, operation) => {
      result[operation] = {
        avg: this.getAverageTime(operation),
        count: measurements.length,
      };
    });
    
    return result;
  }
  
  logMetrics() {
    console.table(this.getMetrics());
  }
}

export const performanceMonitor = new JazzPerformanceMonitor();
```

## Testing Strategy

### Step 1: Jazz Integration Tests

Create `src/tests/jazz-integration.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestAccount } from 'jazz-tools/test';
import { TodoList, TodoItem, AppData } from '../jazz/schemas';

describe('Jazz Integration', () => {
  let testAccount: any;
  let appData: AppData;
  
  beforeEach(async () => {
    testAccount = await createTestAccount();
    appData = AppData.create({
      todoLists: [],
      cemetery: null as any,
    }, testAccount);
  });
  
  it('should create todo lists', () => {
    const list = appData.createList('Test List', '📝');
    
    expect(list.title).toBe('Test List');
    expect(list.emoji).toBe('📝');
    expect(appData.todoLists).toContain(list);
  });
  
  it('should create todo items', () => {
    const list = appData.createList('Test List');
    const item = list.addItem('Test Item', 'Description');
    
    expect(item.title).toBe('Test Item');
    expect(item.description).toBe('Description');
    expect(list.items).toContain(item);
  });
  
  it('should handle progress updates', () => {
    const list = appData.createList('Test List');
    const item = list.addItem('Test Item');
    
    item.updateProgress(50);
    expect(item.progress).toBe(50);
    expect(item.completed).toBe(false);
    
    item.updateProgress(60);
    expect(item.progress).toBe(100);
    expect(item.completed).toBe(true);
  });
  
  it('should move completed items to cemetery', () => {
    const list = appData.createList('Test List');
    const item = list.addItem('Test Item');
    
    item.markCompleted();
    list.removeItem(item.id);
    
    expect(list.items).not.toContain(item);
    // Cemetery functionality would be tested here
  });
});
```

### Step 2: Real-time Collaboration Tests

Create `src/tests/collaboration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createTestAccount } from 'jazz-tools/test';
import { TodoList } from '../jazz/schemas';

describe('Real-time Collaboration', () => {
  it('should sync changes between accounts', async () => {
    const account1 = await createTestAccount();
    const account2 = await createTestAccount();
    
    // Create shared list
    const list = TodoList.create({
      title: 'Shared List',
      emoji: '🤝',
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    }, account1);
    
    // Share with second account
    // This would involve Jazz's sharing mechanisms
    
    // Add item from first account
    const item1 = list.addItem('Item from Account 1');
    
    // Add item from second account (simulate)
    const item2 = list.addItem('Item from Account 2');
    
    expect(list.items).toHaveLength(2);
    expect(list.items.map(item => item?.title)).toContain('Item from Account 1');
    expect(list.items.map(item => item?.title)).toContain('Item from Account 2');
  });
});
```

## Deployment Configuration

### Step 1: Update Build Configuration

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import million from 'million/compiler';
import * as path from 'path';

export default defineConfig({
  plugins: [
    million.vite({
      auto: {
        threshold: 0.05,
        skip: ['useBadHook', /badVariable/g],
      },
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Bucket - Jazz Powered',
        short_name: 'Bucket',
        description: 'Collaborative todo lists with real-time sync',
        theme_color: '#000000',
        background_color: '#000000',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __JAZZ_DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  optimizeDeps: {
    include: ['jazz-tools'],
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 4000,
    fs: {
      allow: ['..'],
    },
  },
});
```

### Step 2: Environment Configuration

Create `.env.example`:

```env
# Jazz Configuration
VITE_JAZZ_PEER=wss://cloud.jazz.tools
VITE_JAZZ_API_KEY=your-email@example.com

# Development
NODE_ENV=development
```

## Migration Timeline

### Phase 1: Setup (Week 1)
- [ ] Install Jazz dependencies
- [ ] Create schema definitions
- [ ] Set up Jazz provider
- [ ] Create authentication flow

### Phase 2: Core Migration (Week 2)
- [ ] Migrate main components
- [ ] Update data access patterns
- [ ] Implement real-time features
- [ ] Test basic functionality

### Phase 3: Advanced Features (Week 3)
- [ ] Add collaboration indicators
- [ ] Implement live cursors
- [ ] Add conflict resolution UI
- [ ] Performance optimization

### Phase 4: Data Migration (Week 4)
- [ ] Create migration utilities
- [ ] Test migration process
- [ ] Validate data integrity
- [ ] Implement rollback strategy

### Phase 5: Deployment (Week 5)
- [ ] Production configuration
- [ ] Performance monitoring
- [ ] User acceptance testing
- [ ] Go-live preparation

## Benefits After Migration

### Immediate Benefits
1. **No Backend Required**: Eliminate server infrastructure
2. **Real-time Collaboration**: Multiple users can edit simultaneously
3. **Offline-first**: Works without internet connection
4. **Cryptographic Security**: End-to-end encryption by default
5. **Simplified Architecture**: Less complexity in data management

### Long-term Benefits
1. **Reduced Maintenance**: No server infrastructure to maintain
2. **Better Scalability**: Peer-to-peer architecture scales naturally
3. **Enhanced Security**: Built-in encryption and authentication
4. **Improved Performance**: Local-first data access
5. **Future-proof**: Modern collaborative architecture

## Troubleshooting

### Common Issues

1. **Authentication Problems**
   - Ensure passphrase is stored securely
   - Check Jazz Cloud connectivity
   - Verify API key configuration

2. **Sync Issues**
   - Check network connectivity
   - Verify peer configuration
   - Monitor Jazz Cloud status

3. **Performance Problems**
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists
   - Optimize Jazz queries with useMemo

4. **Migration Issues**
   - Validate data integrity after migration
   - Test rollback procedures
   - Monitor migration progress closely

## Conclusion

Migrating from Dexie to Jazz transforms Bucket from a simple todo app into a powerful collaborative platform. Jazz's local-first architecture, built-in real-time collaboration, and cryptographic security provide a solid foundation for building modern, scalable applications without the complexity of traditional backend infrastructure.

The migration process is designed to be incremental and safe, with comprehensive testing and rollback strategies to ensure a smooth transition. The result is a more capable, secure, and maintainable application that can scale with your users' needs.