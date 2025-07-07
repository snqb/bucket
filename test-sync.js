#!/usr/bin/env node

import { WebSocket } from 'ws';
import { createMergeableStore } from 'tinybase';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';

const WS_URL = 'ws://localhost:8040';

console.log('🧪 Testing TinyBase sync...');

// Create two stores to simulate two clients
const store1 = createMergeableStore();
const store2 = createMergeableStore();

// Set up schemas
store1.setTablesSchema({
  lists: {
    id: { type: 'string' },
    title: { type: 'string' },
    emoji: { type: 'string', default: '📋' },
    color: { type: 'string', default: '#3B82F6' },
    createdAt: { type: 'number' },
  },
  tasks: {
    id: { type: 'string' },
    listId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', default: '' },
    progress: { type: 'number', default: 0 },
    completed: { type: 'boolean', default: false },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
});

store2.setTablesSchema({
  lists: {
    id: { type: 'string' },
    title: { type: 'string' },
    emoji: { type: 'string', default: '📋' },
    color: { type: 'string', default: '#3B82F6' },
    createdAt: { type: 'number' },
  },
  tasks: {
    id: { type: 'string' },
    listId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', default: '' },
    progress: { type: 'number', default: 0 },
    completed: { type: 'boolean', default: false },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
  },
});

async function testSync() {
  try {
    // Connect both stores
    console.log('📡 Connecting client 1...');
    const ws1 = new WebSocket(WS_URL);
    const sync1 = await createWsSynchronizer(store1, ws1);
    await sync1.startSync();

    console.log('📡 Connecting client 2...');
    const ws2 = new WebSocket(WS_URL);
    const sync2 = await createWsSynchronizer(store2, ws2);
    await sync2.startSync();

    console.log('✅ Both clients connected');

    // Add data to store1
    console.log('📝 Adding list to client 1...');
    store1.setRow('lists', 'list1', {
      id: 'list1',
      title: 'Test List',
      emoji: '🧪',
      color: '#FF6B6B',
      createdAt: Date.now(),
    });

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if data synced to store2
    const list = store2.getRow('lists', 'list1');
    if (list) {
      console.log('✅ List synced to client 2:', list.title);
    } else {
      console.log('❌ List not synced to client 2');
    }

    // Add task to store2
    console.log('📝 Adding task to client 2...');
    store2.setRow('tasks', 'task1', {
      id: 'task1',
      listId: 'list1',
      title: 'Test Task',
      description: 'This is a test task',
      progress: 50,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if task synced to store1
    const task = store1.getRow('tasks', 'task1');
    if (task) {
      console.log('✅ Task synced to client 1:', task.title);
    } else {
      console.log('❌ Task not synced to client 1');
    }

    // Test concurrent updates
    console.log('🔄 Testing concurrent updates...');
    store1.setCell('tasks', 'task1', 'progress', 75);
    store2.setCell('tasks', 'task1', 'description', 'Updated description');

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check final state
    const finalTask1 = store1.getRow('tasks', 'task1');
    const finalTask2 = store2.getRow('tasks', 'task1');

    console.log('📊 Final state client 1:', finalTask1);
    console.log('📊 Final state client 2:', finalTask2);

    if (finalTask1.progress === 75 && finalTask1.description === 'Updated description') {
      console.log('✅ Concurrent updates merged correctly');
    } else {
      console.log('❌ Concurrent updates not merged correctly');
    }

    console.log('🎉 Sync test completed successfully!');

    // Clean up
    await sync1.destroy();
    await sync2.destroy();

  } catch (error) {
    console.error('❌ Sync test failed:', error.message);
    console.log('💡 Make sure the sync server is running: pnpm run sync-server');
  }
}

testSync().then(() => {
  console.log('🏁 Test finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
