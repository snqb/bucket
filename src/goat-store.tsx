import { useDB, useQuery, useDBReady } from "@goatdb/goatdb/react";
import {
  kSchemaTodoList,
  kSchemaTodoItem,
  kSchemaCemetery,
} from "./goat-schemas";
import * as R from "ramda";
import { useCallback } from "react";

// Keep the same interfaces for compatibility
export interface TodoList {
  id?: string;
  title: string;
  emoji?: string;
}

export interface TodoItem {
  id?: string;
  title: string;
  progress: number;
  description?: string;
  todoListId: string;
}

// Hook to get all todo lists (replaces bucketDB.todoLists.toArray())
export function useGoatTodoLists(): TodoList[] {
  const db = useDB();

  const userRepoPath = db.currentUser
    ? `/data/${db.currentUser.key}`
    : "/data/anonymous";

  try {
    const query = useQuery({
      schema: kSchemaTodoList,
      source: userRepoPath,
      sortDescriptor: (a: any, b: any) =>
        a.get("createdAt").getTime() - b.get("createdAt").getTime(),
      showIntermittentResults: true,
    });

    return query.results().map(({ item, path }: any) => ({
      id: path.split("/").pop(),
      title: item.get("title"),
      emoji: item.get("emoji"),
    }));
  } catch {
    return [];
  }
}

// Hook to get all todo items (replaces bucketDB.todoItems.toArray())
export function useGoatTodoItems(): TodoItem[] {
  const db = useDB();

  const userRepoPath = db.currentUser
    ? `/data/${db.currentUser.key}`
    : "/data/anonymous";

  try {
    const query = useQuery({
      schema: kSchemaTodoItem,
      source: userRepoPath,
      sortDescriptor: (a: any, b: any) =>
        b.get("createdAt").getTime() - a.get("createdAt").getTime(),
      showIntermittentResults: true,
    });

    return query.results().map(({ item, path }: any) => ({
      id: path.split("/").pop(),
      title: item.get("title"),
      progress: item.get("progress"),
      description: item.get("description"),
      todoListId: item.get("todoListId"),
    }));
  } catch {
    return [];
  }
}

// Hook to get todo items for a specific list
export function useGoatTodoItemsWhere(criteria: {
  todoListId: string;
}): TodoItem[] {
  const db = useDB();

  const userRepoPath = db.currentUser
    ? `/data/${db.currentUser.key}`
    : "/data/anonymous";

  try {
    const query = useQuery({
      schema: kSchemaTodoItem,
      source: userRepoPath,
      predicate: ({ item }: any) =>
        item.get("todoListId") === criteria.todoListId,
      sortDescriptor: (a: any, b: any) =>
        b.get("createdAt").getTime() - a.get("createdAt").getTime(),
      showIntermittentResults: true,
    });

    return query.results().map(({ item, path }: any) => ({
      id: path.split("/").pop(),
      title: item.get("title"),
      progress: item.get("progress"),
      description: item.get("description"),
      todoListId: item.get("todoListId"),
    }));
  } catch {
    return [];
  }
}

// Hook to get cemetery items
export function useGoatCemeteryItems(): TodoItem[] {
  const db = useDB();

  const userRepoPath = db.currentUser
    ? `/data/${db.currentUser.key}`
    : "/data/anonymous";

  try {
    const query = useQuery({
      schema: kSchemaCemetery,
      source: userRepoPath,
      sortDescriptor: (a: any, b: any) =>
        b.get("deletedAt").getTime() - a.get("deletedAt").getTime(),
      showIntermittentResults: true,
    });

    return query.results().map(({ item, path }: any) => ({
      id: path.split("/").pop(),
      title: item.get("title"),
      progress: item.get("progress"),
      description: item.get("description"),
      todoListId: item.get("todoListId"),
    }));
  } catch {
    return [];
  }
}

// Hook that provides action functions - follows React hooks rules
export function useGoatActions() {
  const db = useDB();

  const userRepoPath = db.currentUser
    ? `/data/${db.currentUser.key}`
    : "/data/anonymous";

  const addTodoList = useCallback(
    (title: string, emoji?: string) => {
      return db.create(userRepoPath, kSchemaTodoList, {
        title,
        emoji: emoji || "📝",
      });
    },
    [db, userRepoPath],
  );

  const addTodoItem = useCallback(
    (title: string, todoListId: string, description?: string) => {
      return db.create(userRepoPath, kSchemaTodoItem, {
        title,
        progress: 0,
        description,
        todoListId,
      });
    },
    [db, userRepoPath],
  );

  const updateTodoList = useCallback(
    (id: string, changes: Partial<TodoList>) => {
      // Note: We can't use useItem here due to hooks rules
      // This would need to be handled differently in practice
      console.warn(
        "updateTodoList needs to be called from a component that uses useItem",
      );
      return null;
    },
    [],
  );

  const updateTodoItem = useCallback(
    (id: string, changes: Partial<TodoItem>) => {
      // Note: We can't use useItem here due to hooks rules
      // This would need to be handled differently in practice
      console.warn(
        "updateTodoItem needs to be called from a component that uses useItem",
      );
      return null;
    },
    [],
  );

  const deleteTodo = useCallback(
    (todo: TodoItem) => {
      if (!todo.id) return;

      // Clone and move to cemetery
      const clone = R.clone(R.omit(["id"], todo));
      db.create(userRepoPath, kSchemaCemetery, {
        title: clone.title,
        progress: clone.progress,
        description: clone.description,
        todoListId: clone.todoListId,
      });

      // Note: Actual deletion would need to be handled at component level
      console.warn(
        "Item deletion needs to be handled in component using useItem",
      );
    },
    [db, userRepoPath],
  );

  const deleteList = useCallback((todoListId: string) => {
    // Note: This is a simplified version - real implementation would need
    // to be handled at component level with proper item access
    console.warn(
      "List deletion needs to be handled in component with proper item access",
    );
  }, []);

  return {
    addTodoList,
    addTodoItem,
    updateTodoList,
    updateTodoItem,
    deleteTodo,
    deleteList,
  };
}

// Compatibility wrapper for useLiveQuery
export function useLiveQuery<T>(queryFn: () => T): T | undefined {
  try {
    return queryFn();
  } catch {
    return undefined;
  }
}

// Compatibility object that mimics the old bucketDB structure
export const bucketDB = {
  todoLists: {
    add: (list: Omit<TodoList, "id">) => {
      console.warn("Use useGoatActions().addTodoList() instead");
      return null;
    },
    update: (id: string, changes: Partial<TodoList>) => {
      console.warn("Use useItem() and item.set() directly instead");
      return null;
    },
    delete: (id: string) => {
      console.warn("Use useItem() and set item.isDeleted = true instead");
    },
    toArray: () => {
      console.warn("Replace with useGoatTodoLists() hook");
      return [];
    },
  },

  todoItems: {
    add: (item: Omit<TodoItem, "id">) => {
      console.warn("Use useGoatActions().addTodoItem() instead");
      return null;
    },
    update: (id: string, changes: Partial<TodoItem>) => {
      console.warn("Use useItem() and item.set() directly instead");
      return null;
    },
    delete: (id: string) => {
      console.warn("Use useItem() and set item.isDeleted = true instead");
    },
    where: (criteria: { todoListId: string }) => ({
      toArray: () => {
        console.warn("Replace with useGoatTodoItemsWhere() hook");
        return [];
      },
      delete: () => {
        console.warn("Handle deletion at component level");
      },
    }),
    toArray: () => {
      console.warn("Replace with useGoatTodoItems() hook");
      return [];
    },
  },

  cemetery: {
    toArray: () => {
      console.warn("Replace with useGoatCemeteryItems() hook");
      return [];
    },
  },

  deleteTodo: (todo: TodoItem) => {
    console.warn(
      "Use useGoatActions().deleteTodo() or handle at component level",
    );
  },

  deleteList: (todoListId: string) => {
    console.warn("Handle list deletion at component level");
  },

  // Stub for cloud configuration
  cloud: {
    configure: (config: any) => {
      console.log("GoatDB sync is built-in, no configuration needed");
    },
  },
};

// Export the ready state hook
export { useDBReady };
