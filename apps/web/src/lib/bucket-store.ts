/**
 * Bucket Store - Core data store and schema
 *
 * Defines:
 * - TinyBase MergeableStore schema
 * - Indexes and relationships
 * - Helper functions for creating/manipulating data
 */

import { createMergeableStore, createIndexes, createRelationships } from 'tinybase';

// Schema definition
export const SCHEMA = {
  tables: {
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
    cemetery: {
      id: { type: 'string' },
      originalTitle: { type: 'string' },
      originalDescription: { type: 'string' },
      originalProgress: { type: 'number' },
      deletedAt: { type: 'number' },
      deletionReason: { type: 'string', default: 'deleted' },
    },
  },
  values: {
    lastSync: { type: 'number', default: 0 },
    deviceId: { type: 'string', default: '' },
    userId: { type: 'string', default: '' },
    passphrase: { type: 'string', default: '' },
  },
} as const;

// Create the main store as MergeableStore for sync support
export const store = createMergeableStore()
  .setTablesSchema(SCHEMA.tables)
  .setValuesSchema(SCHEMA.values);

// Create indexes for better performance
export const indexes = createIndexes(store);
indexes.setIndexDefinition('tasksByList', 'tasks', 'listId');
indexes.setIndexDefinition('completedTasks', 'tasks', 'completed');

// Create relationships
export const relationships = createRelationships(store);
relationships.setRelationshipDefinition('listTasks', 'lists', 'tasks', 'listId');

// Helper: Generate unique ID
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// CRUD operations for lists
export const createList = (title: string, emoji?: string, color?: string) => {
  const id = generateId();
  store.setRow('lists', id, {
    id,
    title,
    emoji: emoji || '📋',
    color: color || '#3B82F6',
    createdAt: Date.now(),
  });
  return id;
};

export const deleteList = (id: string) => {
  // Delete all tasks in this list
  const tasks = store.getRowIds('tasks');
  tasks.forEach((taskId) => {
    const task = store.getRow('tasks', taskId);
    if (task?.listId === id) {
      deleteTask(taskId, 'list deleted');
    }
  });

  // Delete the list
  store.delRow('lists', id);
};

// CRUD operations for tasks
export const createTask = (
  listId: string,
  title: string,
  description?: string,
) => {
  const id = generateId();
  const now = Date.now();
  store.setRow('tasks', id, {
    id,
    listId,
    title,
    description: description || '',
    progress: 0,
    completed: false,
    createdAt: now,
    updatedAt: now,
  });
  return id;
};

export const updateTask = (
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    progress: number;
    completed: boolean;
  }>,
) => {
  const current = store.getRow('tasks', id);
  if (!current) return;

  store.setRow('tasks', id, {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteTask = (id: string, reason?: string) => {
  const task = store.getRow('tasks', id);
  if (!task) return;

  // Move to cemetery
  const cemeteryId = generateId();
  store.setRow('cemetery', cemeteryId, {
    id: cemeteryId,
    originalTitle: task.title as string,
    originalDescription: task.description as string,
    originalProgress: task.progress as number,
    deletedAt: Date.now(),
    deletionReason: reason || 'deleted',
  });

  // Remove from tasks
  store.delRow('tasks', id);
};

// Query helpers
export const getListTasks = (listId: string) => {
  return indexes.getSliceRowIds('tasksByList', listId);
};

export const getCompletedTasks = () => {
  return indexes.getSliceRowIds('completedTasks', 'true');
};

// Cemetery operations
export const restoreFromCemetery = (cemeteryId: string, listId: string) => {
  const cemeteryItem = store.getRow('cemetery', cemeteryId);
  if (!cemeteryItem) return;

  // Create new task from cemetery data
  const taskId = generateId();
  const now = Date.now();
  store.setRow('tasks', taskId, {
    id: taskId,
    listId,
    title: cemeteryItem.originalTitle as string,
    description: cemeteryItem.originalDescription as string,
    progress: cemeteryItem.originalProgress as number,
    completed: false,
    createdAt: now,
    updatedAt: now,
  });

  // Remove from cemetery
  store.delRow('cemetery', cemeteryId);

  return taskId;
};

export const permanentlyDelete = (cemeteryId: string) => {
  store.delRow('cemetery', cemeteryId);
};
