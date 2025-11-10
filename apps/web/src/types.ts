/**
 * Shared TypeScript types for Bucket app
 */

export interface List {
  id: string;
  title: string;
  emoji: string;
  color: string;
  createdAt: number;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CemeteryItem {
  id: string;
  originalTitle: string;
  originalDescription: string;
  originalProgress: number;
  deletedAt: number;
  deletionReason: string;
}

export interface BucketActions {
  createList: (title: string, emoji?: string, color?: string) => string;
  createTask: (listId: string, title: string, description?: string) => string;
  updateTask: (
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      progress: number;
      completed: boolean;
    }>
  ) => void;
  deleteTask: (taskId: string, reason?: string) => void;
  deleteList: (listId: string) => void;
  restoreFromCemetery: (cemeteryId: string, listId: string) => string | undefined;
  permanentlyDelete: (cemeteryId: string) => void;
  toggleTaskCompleted: (taskId: string) => void;
  setTaskProgress: (taskId: string, progress: number) => void;
  updateListTitle: (listId: string, title: string) => void;
  updateListEmoji: (listId: string, emoji: string) => void;
  updateListColor: (listId: string, color: string) => void;
  markCompleted: (taskId: string) => void;
  clearCemetery: () => void;
}
