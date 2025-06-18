# Ditch Dixie - Database Migration Strategy

## Overview

This document outlines the strategy for migrating the Bucket application from Dexie (IndexedDB) to GoatDB, an embedded distributed document database that offers superior performance, real-time collaboration, and enhanced developer experience.

## Why Ditch Dixie?

### Current Limitations with Dexie

1. **Complex Asynchronous Operations**
   - Heavy reliance on async/await patterns
   - Difficult state synchronization
   - Race condition vulnerabilities
   - Complex error handling requirements

2. **Limited Real-time Capabilities**
   - Basic cloud sync through Dexie Cloud
   - No built-in conflict resolution
   - Limited offline-first features
   - Requires external authentication management

3. **Performance Bottlenecks**
   - IndexedDB overhead for simple operations
   - No incremental query optimization
   - Memory inefficient for large datasets
   - Slower read operations

4. **Developer Experience Issues**
   - Verbose query syntax
   - Complex transaction management
   - Limited TypeScript integration
   - Debugging challenges

### GoatDB Advantages

1. **Synchronous API**
   - Eliminates async/await complexity
   - Direct state manipulation
   - Predictable execution flow
   - Simplified error handling

2. **Built-in Collaboration**
   - Real-time synchronization
   - Automatic conflict resolution using CRDTs
   - Distributed architecture
   - Cryptographic signing support

3. **Superior Performance**
   - Memory-first design
   - Incremental local queries
   - Optimized for TypeScript
   - Faster read/write operations

4. **Enhanced Developer Experience**
   - Intuitive API design
   - Schema-first approach
   - Built-in React hooks
   - Version control concepts

## Migration Plan

### Phase 1: Setup and Schema Definition

#### 1.1 Install GoatDB
```bash
# Add GoatDB to the project
pnpm dlx jsr add @goatdb/goatdb

# Initialize React scaffold (if needed)
# deno run -A jsr:@goatdb/goatdb/init
```

#### 1.2 Define Schemas
Create `src/goat-schemas.ts`:
```typescript
import { DataRegistry } from '@goatdb/goatdb';

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
    createdAt: {
      type: 'date',
      default: () => new Date(),
    },
    color: {
      type: 'string',
      required: false,
    },
  },
} as const;

export const kSchemaTodoItem = {
  ns: 'todoitem',
  version: 1,
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    progress: {
      type: 'number',
      default: () => 0,
    },
    description: {
      type: 'string',
      required: false,
    },
    completed: {
      type: 'boolean',
      default: () => false,
    },
    createdAt: {
      type: 'date',
      default: () => new Date(),
    },
    listId: {
      type: 'string',
      required: true,
    },
  },
} as const;

export const kSchemaCemeteryItem = {
  ns: 'cemetery',
  version: 1,
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    originalProgress: {
      type: 'number',
      default: () => 0,
    },
    description: {
      type: 'string',
      required: false,
    },
    deletedAt: {
      type: 'date',
      default: () => new Date(),
    },
    originalListId: {
      type: 'string',
      required: true,
    },
  },
} as const;

export type TodoListType = typeof kSchemaTodoList;
export type TodoItemType = typeof kSchemaTodoItem;
export type CemeteryItemType = typeof kSchemaCemeteryItem;

export function registerSchemas(registry: DataRegistry = DataRegistry.default): void {
  registry.registerSchema(kSchemaTodoList);
  registry.registerSchema(kSchemaTodoItem);
  registry.registerSchema(kSchemaCemeteryItem);
  
  // Authorization rules for user-specific data
  registry.registerAuthRule(
    /\/data\/\w+/,
    ({ repoPath, session }) => repoPath.includes(session.owner)
  );
}
```

### Phase 2: Component Migration

#### 2.1 Update Store Configuration
Replace `src/store.ts` with `src/goat-store.ts`:
```typescript
import { useDB, useItem, useQuery } from '@goatdb/goatdb/react';
import { kSchemaTodoList, kSchemaTodoItem, kSchemaCemeteryItem } from './goat-schemas';

export class GoatStore {
  private db = useDB();
  
  // Get user's repository path
  get userRepoPath() {
    return `/data/${this.db.currentUser?.key || 'anonymous'}`;
  }
  
  // Create new todo list
  createTodoList(title: string, emoji?: string) {
    return this.db.create(this.userRepoPath, kSchemaTodoList, {
      title,
      emoji,
    });
  }
  
  // Create new todo item
  createTodoItem(title: string, listId: string, description?: string) {
    return this.db.create(this.userRepoPath, kSchemaTodoItem, {
      title,
      listId,
      description,
    });
  }
  
  // Move item to cemetery
  moveTocemetery(item: any) {
    // Create cemetery entry
    this.db.create(this.userRepoPath, kSchemaCemeteryItem, {
      title: item.get('title'),
      originalProgress: item.get('progress'),
      description: item.get('description'),
      originalListId: item.get('listId'),
    });
    
    // Delete original item
    item.isDeleted = true;
  }
  
  // Delete entire list
  deleteList(listId: string) {
    // Find all items in the list
    const items = this.db.query({
      schema: kSchemaTodoItem,
      source: this.userRepoPath,
      predicate: ({ item }) => item.get('listId') === listId,
    });
    
    // Move items to cemetery
    items.results().forEach(({ item }) => {
      this.moveTocemetery(item);
    });
    
    // Delete the list
    const list = this.db.get(`${this.userRepoPath}/${listId}`);
    if (list) {
      list.isDeleted = true;
    }
  }
}
```

#### 2.2 Update App Component
Modify `src/App.tsx`:
```typescript
import React from 'react';
import { useDB, useDBReady } from '@goatdb/goatdb/react';
import { BucketView } from './BucketView';
import { CemeteryView } from './CemeteryView';
import { LoginView } from './LoginView';
import { Route, Switch } from 'wouter';

function App() {
  const db = useDB();
  const ready = useDBReady();

  if (ready === 'loading') {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-white">Loading...</div>
    </div>;
  }
  
  if (ready === 'error') {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-red-500">Error loading database</div>
    </div>;
  }

  if (!db.loggedIn) {
    return <LoginView />;
  }

  return (
    <Switch>
      <Route path="/" component={BucketView} />
      <Route path="/cemetery" component={CemeteryView} />
    </Switch>
  );
}

export default App;
```

#### 2.3 Update Screen Component
Modify `src/Screen.tsx` to use GoatDB hooks:
```typescript
import React from 'react';
import { useItem, useQuery } from '@goatdb/goatdb/react';
import { motion } from 'framer-motion';
import { kSchemaTodoItem, TodoListType } from './goat-schemas';
import { TaskItem } from './TaskItem';
import { TaskAdder } from './TaskAdder';

interface ScreenProps {
  listPath: string;
  className?: string;
}

export function Screen({ listPath, className }: ScreenProps) {
  const list = useItem<TodoListType>(listPath);
  
  const itemsQuery = useQuery({
    schema: kSchemaTodoItem,
    source: listPath.split('/').slice(0, -1).join('/'), // Get repo path
    predicate: ({ item }) => item.get('listId') === list?.id,
    sortBy: 'createdAt',
    sortDescending: true,
  });

  if (!list) return null;

  const bg = `hsla(${Math.abs(list.get('title').split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%, 0.1)`;

  return (
    <motion.div
      className={`m-2 flex flex-col items-stretch gap-3 overflow-hidden border border-gray-600 bg-opacity-15 px-5 pb-9 pt-6 ${className}`}
      style={{ background: bg }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="flex items-center gap-2">
        <div 
          className="text-2xl cursor-pointer"
          onClick={() => list.set('emoji', getRandomEmoji())}
        >
          {list.get('emoji')}
        </div>
        <h2 className="font-bold text-2xl flex-1">
          {list.get('title')}
        </h2>
        <button
          className="p-1 hover:bg-gray-700 rounded"
          onClick={() => {
            const newTitle = prompt('New title:', list.get('title'));
            if (newTitle) list.set('title', newTitle);
          }}
        >
          ✏️
        </button>
        <button
          className="p-1 hover:bg-gray-700 rounded"
          onClick={() => {
            if (confirm(`Delete ${list.get('title')}?`)) {
              list.isDeleted = true;
            }
          }}
        >
          🗑️
        </button>
      </div>
      
      <hr className="border-gray-500" />
      
      <TaskAdder listPath={listPath} />
      
      <div className="flex flex-col gap-2">
        {itemsQuery.results().map(({ path }) => (
          <TaskItem key={path} itemPath={path} />
        ))}
      </div>
    </motion.div>
  );
}
```

### Phase 3: Data Migration

#### 3.1 Create Migration Utility
Create `src/migration.ts`:
```typescript
import { bucketDB } from './store'; // Old Dexie store
import { useDB } from '@goatdb/goatdb/react';
import { kSchemaTodoList, kSchemaTodoItem, kSchemaCemeteryItem } from './goat-schemas';

export async function migrateDexieToGoatDB() {
  const goatDB = useDB();
  const userRepoPath = `/data/${goatDB.currentUser?.key || 'anonymous'}`;
  
  try {
    // Migrate todo lists
    const dexieLists = await bucketDB.todoLists.toArray();
    for (const list of dexieLists) {
      goatDB.create(userRepoPath, kSchemaTodoList, {
        title: list.title,
        emoji: list.emoji || '📝',
      });
    }
    
    // Migrate todo items
    const dexieItems = await bucketDB.todoItems.toArray();
    for (const item of dexieItems) {
      goatDB.create(userRepoPath, kSchemaTodoItem, {
        title: item.title,
        progress: item.progress,
        description: item.description,
        listId: item.todoListId.toString(),
        completed: item.progress >= 100,
      });
    }
    
    // Migrate cemetery items
    const cemeteryItems = await bucketDB.cemetery.toArray();
    for (const item of cemeteryItems) {
      goatDB.create(userRepoPath, kSchemaCemeteryItem, {
        title: item.title,
        originalProgress: item.progress || 0,
        description: item.description,
        originalListId: item.todoListId?.toString() || 'unknown',
      });
    }
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
```

### Phase 4: Performance Optimizations

#### 4.1 Implement Incremental Updates
- Use GoatDB's incremental queries for efficient re-rendering
- Leverage the synchronous API to eliminate loading states
- Implement optimistic updates for immediate UI feedback

#### 4.2 Memory Management
- Take advantage of GoatDB's memory-first design
- Implement efficient data structures for large lists
- Use query predicates to filter data efficiently

### Phase 5: Testing and Validation

#### 5.1 Feature Parity Testing
- Verify all existing features work with GoatDB
- Test offline functionality
- Validate data persistence
- Ensure UI responsiveness

#### 5.2 Performance Testing
- Benchmark query performance
- Test with large datasets
- Validate memory usage
- Measure real-time sync latency

#### 5.3 Migration Testing
- Test data migration from Dexie to GoatDB
- Verify data integrity
- Test rollback scenarios
- Validate user experience during migration

## Benefits After Migration

### Immediate Benefits
1. **Simplified Code**: Removal of async/await complexity
2. **Better Performance**: Faster queries and updates
3. **Real-time Sync**: Built-in collaboration features
4. **Type Safety**: Enhanced TypeScript integration

### Long-term Benefits
1. **Scalability**: Distributed architecture for growth
2. **Reliability**: Built-in conflict resolution
3. **Developer Experience**: Intuitive API and debugging
4. **Future-proofing**: Modern database architecture

## Rollback Strategy

If migration issues arise:
1. Keep Dexie code as fallback during transition period
2. Implement feature flags to switch between databases
3. Maintain data export/import capabilities
4. Provide clear migration status to users

## Timeline

- **Week 1**: Setup GoatDB and define schemas
- **Week 2**: Migrate core components
- **Week 3**: Implement data migration utility
- **Week 4**: Testing and optimization
- **Week 5**: Production deployment and monitoring

## Conclusion

Migrating from Dexie to GoatDB will significantly improve the Bucket application's performance, developer experience, and real-time capabilities. The synchronous API, built-in collaboration features, and superior performance make GoatDB the ideal choice for this modern todo application.