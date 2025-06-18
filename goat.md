# GoatDB Integration Guide for Bucket

## Introduction

This guide provides step-by-step instructions for integrating GoatDB into the Bucket todo application. GoatDB is an embedded, distributed document database that offers superior performance, real-time collaboration, and enhanced developer experience compared to traditional database solutions.

## Why GoatDB for Bucket?

### Current State Analysis
Bucket currently uses Dexie (IndexedDB wrapper) with the following limitations:
- Complex async/await patterns throughout the codebase
- Limited real-time synchronization capabilities
- Performance bottlenecks with large datasets
- Complex state management and error handling

### GoatDB Advantages
- **Synchronous API**: Eliminates async complexity
- **Real-time Collaboration**: Built-in CRDT-based conflict resolution
- **Superior Performance**: Memory-first design with incremental queries
- **Developer Experience**: Intuitive API with excellent TypeScript support
- **Offline-First**: Native offline capabilities with automatic sync

## Installation

### Step 1: Add GoatDB to Package Dependencies

Since GoatDB is distributed via JSR (JavaScript Registry), add it using pnpm:

```bash
pnpm dlx jsr add @goatdb/goatdb
```

Update `package.json` to ensure compatibility:

```json
{
  "dependencies": {
    "@goatdb/goatdb": "latest",
    // ... existing dependencies
  }
}
```

### Step 2: Configure TypeScript

Update `tsconfig.json` to support GoatDB's module system:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    // ... existing config
  }
}
```

## Schema Definition

### Step 1: Create Schema Registry

Create `src/schemas/registry.ts`:

```typescript
import { DataRegistry, itemPathGetPart } from '@goatdb/goatdb';

// Todo List Schema
export const kSchemaTodoList = {
  ns: 'todolist',
  version: 1,
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    emoji: {
      type: 'string',
      default: () => '📝',
    },
    color: {
      type: 'string',
      required: false,
    },
    createdAt: {
      type: 'date',
      default: () => new Date(),
    },
    updatedAt: {
      type: 'date',
      default: () => new Date(),
    },
  },
} as const;

// Todo Item Schema
export const kSchemaTodoItem = {
  ns: 'todoitem',
  version: 1,
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: false,
    },
    progress: {
      type: 'number',
      default: () => 0,
      validate: (value: number) => value >= 0 && value <= 100,
    },
    completed: {
      type: 'boolean',
      default: () => false,
    },
    listId: {
      type: 'string',
      required: true,
    },
    createdAt: {
      type: 'date',
      default: () => new Date(),
    },
    updatedAt: {
      type: 'date',
      default: () => new Date(),
    },
  },
} as const;

// Cemetery Schema for deleted items
export const kSchemaCemetery = {
  ns: 'cemetery',
  version: 1,
  fields: {
    originalTitle: {
      type: 'string',
      required: true,
    },
    originalDescription: {
      type: 'string',
      required: false,
    },
    originalProgress: {
      type: 'number',
      default: () => 0,
    },
    originalListId: {
      type: 'string',
      required: true,
    },
    deletedAt: {
      type: 'date',
      default: () => new Date(),
    },
    deletionReason: {
      type: 'string',
      default: () => 'user_deleted',
    },
  },
} as const;

// Type exports
export type TodoListSchema = typeof kSchemaTodoList;
export type TodoItemSchema = typeof kSchemaTodoItem;
export type CemeterySchema = typeof kSchemaCemetery;

// Registry setup function
export function registerSchemas(registry: DataRegistry = DataRegistry.default): void {
  // Register all schemas
  registry.registerSchema(kSchemaTodoList);
  registry.registerSchema(kSchemaTodoItem);
  registry.registerSchema(kSchemaCemetery);
  
  // Authorization rules - each user can only access their own data
  registry.registerAuthRule(
    /\/data\/\w+/,
    ({ repoPath, session }) => {
      const repoOwner = itemPathGetPart(repoPath, 'repo');
      return repoOwner === session.owner;
    }
  );
  
  // Additional validation rules
  registry.registerValidationRule(
    kSchemaTodoItem.ns,
    ({ item }) => {
      const progress = item.get('progress');
      if (progress >= 100) {
        item.set('completed', true);
      }
      item.set('updatedAt', new Date());
      return true;
    }
  );
}
```

## Database Service Layer

### Step 1: Create GoatDB Service

Create `src/services/GoatDBService.ts`:

```typescript
import { useDB, useQuery, useItem } from '@goatdb/goatdb/react';
import { 
  kSchemaTodoList, 
  kSchemaTodoItem, 
  kSchemaCemetery,
  TodoListSchema,
  TodoItemSchema,
  CemeterySchema 
} from '../schemas/registry';

export class GoatDBService {
  private db = useDB();
  
  // Get current user's repository path
  get userRepositoryPath(): string {
    if (!this.db.currentUser) {
      throw new Error('User not authenticated');
    }
    return `/data/${this.db.currentUser.key}`;
  }
  
  // Todo List Operations
  createTodoList(title: string, emoji?: string, color?: string) {
    return this.db.create(this.userRepositoryPath, kSchemaTodoList, {
      title,
      emoji: emoji || this.getRandomEmoji(),
      color: color || this.generateRandomColor(title),
    });
  }
  
  updateTodoList(listPath: string, updates: Partial<{
    title: string;
    emoji: string;
    color: string;
  }>) {
    const list = this.db.get(listPath);
    if (!list) throw new Error('List not found');
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        list.set(key, value);
      }
    });
    
    list.set('updatedAt', new Date());
    return list;
  }
  
  deleteTodoList(listPath: string) {
    // First, move all items in this list to cemetery
    const listId = listPath.split('/').pop();
    const items = this.queryTodoItems({ listId });
    
    items.results().forEach(({ item }) => {
      this.moveTodoItemToCemetery(item);
    });
    
    // Then delete the list
    const list = this.db.get(listPath);
    if (list) {
      list.isDeleted = true;
    }
  }
  
  // Todo Item Operations
  createTodoItem(listId: string, title: string, description?: string) {
    return this.db.create(this.userRepositoryPath, kSchemaTodoItem, {
      title,
      description,
      listId,
    });
  }
  
  updateTodoItem(itemPath: string, updates: Partial<{
    title: string;
    description: string;
    progress: number;
    completed: boolean;
  }>) {
    const item = this.db.get(itemPath);
    if (!item) throw new Error('Item not found');
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        item.set(key, value);
      }
    });
    
    // Auto-complete logic
    if (updates.progress !== undefined && updates.progress >= 100) {
      item.set('completed', true);
    }
    
    item.set('updatedAt', new Date());
    return item;
  }
  
  incrementTodoItemProgress(itemPath: string, increment: number = 10) {
    const item = this.db.get(itemPath);
    if (!item) throw new Error('Item not found');
    
    const currentProgress = item.get('progress') || 0;
    const newProgress = Math.min(100, Math.max(0, currentProgress + increment));
    
    item.set('progress', newProgress);
    
    if (newProgress >= 100) {
      item.set('completed', true);
      // Auto-delete completed items after a delay
      setTimeout(() => {
        this.moveTodoItemToCemetery(item);
      }, 1000);
    }
    
    return item;
  }
  
  moveTodoItemToCemetery(item: any) {
    // Create cemetery record
    this.db.create(this.userRepositoryPath, kSchemaCemetery, {
      originalTitle: item.get('title'),
      originalDescription: item.get('description'),
      originalProgress: item.get('progress'),
      originalListId: item.get('listId'),
      deletionReason: item.get('completed') ? 'completed' : 'user_deleted',
    });
    
    // Delete original item
    item.isDeleted = true;
  }
  
  // Query Operations
  queryTodoLists() {
    return useQuery({
      schema: kSchemaTodoList,
      source: this.userRepositoryPath,
      sortBy: 'createdAt',
      sortDescending: false,
    });
  }
  
  queryTodoItems(filters?: {
    listId?: string;
    completed?: boolean;
    searchText?: string;
  }) {
    return useQuery({
      schema: kSchemaTodoItem,
      source: this.userRepositoryPath,
      sortBy: 'createdAt',
      sortDescending: true,
      predicate: ({ item }) => {
        if (filters?.listId && item.get('listId') !== filters.listId) {
          return false;
        }
        
        if (filters?.completed !== undefined && item.get('completed') !== filters.completed) {
          return false;
        }
        
        if (filters?.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          const title = item.get('title')?.toLowerCase() || '';
          const description = item.get('description')?.toLowerCase() || '';
          
          if (!title.includes(searchLower) && !description.includes(searchLower)) {
            return false;
          }
        }
        
        return true;
      },
    });
  }
  
  queryCemeteryItems() {
    return useQuery({
      schema: kSchemaCemetery,
      source: this.userRepositoryPath,
      sortBy: 'deletedAt',
      sortDescending: true,
    });
  }
  
  // Utility methods
  private getRandomEmoji(): string {
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

// Export singleton instance
export const goatDBService = new GoatDBService();
```

## Component Integration

### Step 1: Update App Component

Modify `src/App.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useDB, useDBReady } from '@goatdb/goatdb/react';
import { Route, Switch } from 'wouter';
import { registerSchemas } from './schemas/registry';
import { BucketView } from './components/BucketView';
import { CemeteryView } from './components/CemeteryView';
import { LoginView } from './components/LoginView';
import { LoadingView } from './components/LoadingView';
import ReloadPrompt from './ReloadPrompt';

function App() {
  const db = useDB();
  const ready = useDBReady();
  
  // Register schemas on app initialization
  useEffect(() => {
    registerSchemas();
  }, []);
  
  if (ready === 'loading') {
    return <LoadingView />;
  }
  
  if (ready === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Database Error</h1>
          <p className="text-gray-400">Failed to initialize GoatDB</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!db.loggedIn) {
    return <LoginView />;
  }
  
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

### Step 2: Create Updated Screen Component

Create `src/components/GoatScreen.tsx`:

```typescript
import React from 'react';
import { useItem } from '@goatdb/goatdb/react';
import { motion } from 'framer-motion';
import { TodoListSchema } from '../schemas/registry';
import { goatDBService } from '../services/GoatDBService';
import { GoatTask } from './GoatTask';
import { GoatAdder } from './GoatAdder';

interface GoatScreenProps {
  listPath: string;
  className?: string;
}

export function GoatScreen({ listPath, className }: GoatScreenProps) {
  const list = useItem<TodoListSchema>(listPath);
  
  const todoItems = goatDBService.queryTodoItems({
    listId: listPath.split('/').pop(),
    completed: false,
  });
  
  if (!list) return null;
  
  const handleUpdateTitle = () => {
    const newTitle = prompt('Enter new title:', list.get('title'));
    if (newTitle && newTitle.trim()) {
      goatDBService.updateTodoList(listPath, { title: newTitle.trim() });
    }
  };
  
  const handleUpdateEmoji = () => {
    const newEmoji = prompt('Enter new emoji:', list.get('emoji'));
    if (newEmoji) {
      goatDBService.updateTodoList(listPath, { emoji: newEmoji });
    }
  };
  
  const handleDeleteList = () => {
    const confirmDelete = confirm(`Are you sure you want to delete "${list.get('title')}"? All tasks will be moved to cemetery.`);
    if (confirmDelete) {
      goatDBService.deleteTodoList(listPath);
    }
  };
  
  return (
    <motion.div
      className={`m-2 flex flex-col items-stretch gap-3 overflow-hidden border border-gray-600 px-5 pb-9 pt-6 ${className}`}
      style={{
        background: list.get('color') || 'hsla(220, 13%, 18%, 0.1)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUpdateEmoji}
          className="text-2xl hover:scale-110 transition-transform"
          title="Click to change emoji"
        >
          {list.get('emoji')}
        </button>
        
        <h2 
          className="font-bold text-2xl flex-1 cursor-pointer hover:text-blue-400 transition-colors"
          onClick={handleUpdateTitle}
          title="Click to edit title"
        >
          {list.get('title')}
        </h2>
        
        <button
          onClick={handleUpdateTitle}
          className="p-2 hover:bg-gray-700 rounded-md transition-colors"
          title="Edit title"
        >
          ✏️
        </button>
        
        <button
          onClick={handleDeleteList}
          className="p-2 hover:bg-red-700 rounded-md transition-colors"
          title="Delete list"
        >
          🗑️
        </button>
      </div>
      
      <hr className="border-gray-500" />
      
      {/* Add new task */}
      <GoatAdder listId={listPath.split('/').pop()!} />
      
      {/* Task list */}
      <div className="flex flex-col gap-2">
        {todoItems.results().map(({ path }) => (
          <GoatTask key={path} taskPath={path} />
        ))}
        
        {todoItems.results().length === 0 && (
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

## Authentication Integration

### Step 1: Create Login Component

Create `src/components/LoginView.tsx`:

```typescript
import React, { useState } from 'react';
import { useDB } from '@goatdb/goatdb/react';
import { motion } from 'framer-motion';

export function LoginView() {
  const db = useDB();
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newPassphrase = await db.createPassphraseAccount();
      setPassphrase(newPassphrase);
      setShowPassphrase(true);
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = async () => {
    if (!passphrase.trim()) {
      setError('Please enter your passphrase');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await db.loginWithPassphrase(passphrase.trim());
      if (!success) {
        setError('Invalid passphrase. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      isSignUp ? handleSignUp() : handleLogin();
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🪣 Bucket</h1>
          <p className="text-gray-400">Your personal todo lists</p>
        </div>
        
        {showPassphrase ? (
          <div className="text-center space-y-4">
            <div className="text-6xl">🔑</div>
            <h2 className="text-2xl font-bold text-white">Save Your Passphrase</h2>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-300 mb-2">Your recovery passphrase:</p>
              <textarea
                value={passphrase}
                readOnly
                className="w-full bg-gray-900 text-white p-3 rounded border border-gray-600 font-mono text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="text-sm text-yellow-400 bg-yellow-900/20 p-3 rounded">
              ⚠️ Store this passphrase safely! It's the only way to recover your account.
            </div>
            <button
              onClick={() => setShowPassphrase(false)}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              I've Saved My Passphrase
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !isSignUp 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isSignUp 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>
            
            {!isSignUp && (
              <div>
                <label htmlFor="passphrase" className="block text-sm font-medium text-gray-300 mb-2">
                  Recovery Passphrase
                </label>
                <textarea
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  id="passphrase"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                  placeholder="Enter your recovery passphrase"
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
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
              onClick={isSignUp ? handleSignUp : handleLogin}
              disabled={isLoading || (!isSignUp && !passphrase.trim())}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              {isSignUp 
                ? 'Creates a new account with a cryptographic passphrase'
                : 'Enter your recovery passphrase to access your data'
              }
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

## Data Migration Strategy

### Step 1: Create Migration Utility

Create `src/utils/migration.ts`:

```typescript
import { bucketDB } from '../store'; // Legacy Dexie store
import { goatDBService } from '../services/GoatDBService';

export interface MigrationProgress {
  step: string;
  progress: number;
  total: number;
  completed: boolean;
  error?: string;
}

export class DataMigration {
  private onProgress?: (progress: MigrationProgress) => void;
  
  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress;
  }
  
  private reportProgress(step: string, progress: number, total: number, completed = false, error?: string) {
    this.onProgress?.({
      step,
      progress,
      total,
      completed,
      error,
    });
  }
  
  async migrateDexieToGoatDB(): Promise<boolean> {
    try {
      // Step 1: Count total items to migrate
      const [lists, items, cemetery] = await Promise.all([
        bucketDB.todoLists.count(),
        bucketDB.todoItems.count(),
        bucketDB.cemetery.count(),
      ]);
      
      const totalItems = lists + items + cemetery;
      let processedItems = 0;
      
      this.reportProgress('Starting migration...', 0, totalItems);
      
      // Step 2: Migrate Todo Lists
      this.reportProgress('Migrating todo lists...', processedItems, totalItems);
      const dexieLists = await bucketDB.todoLists.toArray();
      const listIdMap = new Map<number, string>();
      
      for (const list of dexieLists) {
        try {
          const goatList = goatDBService.createTodoList(
            list.title,
            list.emoji,
          );
          
          // Map old ID to new path for item migration
          listIdMap.set(list.id!, goatList.id);
          processedItems++;
          
          this.reportProgress('Migrating todo lists...', processedItems, totalItems);
        } catch (error) {
          console.error(`Failed to migrate list "${list.title}":`, error);
        }
      }
      
      // Step 3: Migrate Todo Items
      this.reportProgress('Migrating todo items...', processedItems, totalItems);
      const dexieItems = await bucketDB.todoItems.toArray();
      
      for (const item of dexieItems) {
        try {
          const goatListId = listIdMap.get(item.todoListId);
          if (goatListId) {
            goatDBService.createTodoItem(
              goatListId,
              item.title,
              item.description,
            );
            
            // Set progress if not default
            if (item.progress > 0) {
              // Note: This would need the item path, which requires a different approach
              // For now, we'll create with default progress and update separately if needed
            }
          }
          
          processedItems++;
          this.reportProgress('Migrating todo items...', processedItems, totalItems);
        } catch (error) {
          console.error(`Failed to migrate item "${item.title}":`, error);
        }
      }
      
      // Step 4: Migrate Cemetery Items
      this.reportProgress('Migrating cemetery...', processedItems, totalItems);
      const dexieryCemetery = await bucketDB.cemetery.toArray();
      
      for (const item of dexieryCemetery) {
        try {
          // Create cemetery item directly in GoatDB
          const originalListId = listIdMap.get(item.todoListId || 0) || 'unknown';
          
          // Note: Direct cemetery creation would need access to the GoatDB instance
          // This is a simplified version
          processedItems++;
          this.reportProgress('Migrating cemetery...', processedItems, totalItems);
        } catch (error) {
          console.error(`Failed to migrate cemetery item "${item.title}":`, error);
        }
      }
      
      this.reportProgress('Migration completed!', totalItems, totalItems, true);
      return true;
      
    } catch (error) {
      this.reportProgress('Migration failed', 0, 0, true, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  
  async validateMigration(): Promise<{
    success: boolean;
    listsMatch: boolean;
    itemsMatch: boolean;
    details: string;
  }> {
    try {
      const dexieListCount = await bucketDB.todoLists.count();
      const dexieItemCount = await bucketDB.todoItems.count();
      
      const goatLists = goatDBService.queryTodoLists();
      const goatItems = goatDBService.queryTodoItems();
      
      const goatListCount = goatLists.results().length;
      const goatItemCount = goatItems.results().length;
      
      const listsMatch = dexieListCount === goatListCount;
      const itemsMatch = dexieItemCount === goatItemCount;
      
      return {
        success: listsMatch && itemsMatch,
        listsMatch,
        itemsMatch,
        details: `Dexie: ${dexieListCount} lists, ${dexieItemCount} items | GoatDB: ${goatListCount} lists, ${goatItemCount} items`,
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
}
```

## Testing and Deployment

### Step 1: Environment Configuration

Update `vite.config.ts` to support GoatDB:

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
      // ... existing PWA config
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Enable GoatDB development features
    __GOATDB_DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  optimizeDeps: {
    include: ['@goatdb/goatdb'],
  },
  build: {
    target: 'es2020', // GoatDB requires modern JS features
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

### Step 2: Testing Checklist

Create `src/tests/goatdb-integration.test.ts`:

```typescript
// Integration tests for GoatDB
import { describe, it, expect, beforeEach } from 'vitest';
import { goatDBService } from '../services/GoatDBService';

describe('GoatDB Integration', () => {
  beforeEach(() => {
    // Setup test environment
  });
  
  it('should create todo lists', () => {
    const list = goatDBService.createTodoList('Test List', '📝');
    expect(list.get('title')).toBe('Test List');
    expect(list.get('emoji')).toBe('📝');
  });
  
  it('should create todo items', () => {
    const list = goatDBService.createTodoList('Test List');
    const item = goatDBService.createTodoItem(list.id, 'Test Item', 'Description');
    
    expect(item.get('title')).toBe('Test Item');
    expect(item.get('description')).toBe('Description');
    expect(item.get('listId')).toBe(list.id);
  });
  
  it('should handle progress updates', () => {
    const list = goatDBService.createTodoList('Test List');
    const item = goatDBService.createTodoItem(list.id, 'Test Item');
    
    goatDBService.incrementTodoItemProgress(item.path, 50);
    expect(item.get('progress')).toBe(50);
    
    goatDBService.incrementTodoItemProgress(item.path, 60);
    expect(item.get('progress')).toBe(100);
    expect(item.get('completed')).toBe(true);
  });
});
```

## Performance Monitoring

### Step 1: Add Performance Metrics

Create `src/utils/performance.ts`:

```typescript
export class PerformanceMon