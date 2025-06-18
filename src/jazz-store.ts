import { useAccount } from "jazz-react";
import { useCallback } from "react";
import {
  Account,
  CemeteryItem,
  initializeAccountRoot,
  TodoItem,
  TodoList,
} from "./jazz-schemas";

// Hook to get the current account with proper initialization
export function useJazzAccount() {
  const account = useAccount(Account, {
    resolve: {
      root: {
        todoLists: { $each: { $onError: null } },
        todoItems: { $each: true },
        cemetery: { $each: true },
      },
      profile: true,
    },
  });

  return account;
}

// Hook to get all todo lists
export function useJazzTodoLists(): TodoList[] {
  const { me } = useJazzAccount();
  console.log(me?.root.todoLists.length);
  // console.log(Account)

  if (!me?.root?.todoLists) {
    return [];
  }

  return me.root.todoLists.filter((item): item is TodoList => item !== null);
}

// Hook to get all todo items
export function useJazzTodoItems(): TodoItem[] {
  const { me } = useJazzAccount();

  if (!me?.root?.todoItems) {
    return [];
  }

  return me.root.todoItems.filter((item): item is TodoItem => item !== null);
}

// Hook to get todo items for a specific list
export function useJazzTodoItemsWhere(criteria: {
  todoListId: string;
}): TodoItem[] {
  const allItems = useJazzTodoItems();

  return allItems.filter((item) => item.todoListId === criteria.todoListId);
}

// Hook to get cemetery items
export function useJazzCemeteryItems(): CemeteryItem[] {
  const { me } = useJazzAccount();

  if (!me?.root?.cemetery) {
    return [];
  }

  return me.root.cemetery.filter((item): item is CemeteryItem => item !== null);
}

// Hook that provides action functions
export function useJazzActions() {
  const { me } = useJazzAccount();

  const addTodoList = useCallback(
    (title: string, emoji?: string) => {
      console.log("🔧 addTodoList called", {
        title,
        emoji,
        hasRoot: !!me?.root,
      });
      if (!me?.root?.todoLists) {
        console.error("❌ No root or todoLists available");
        return null;
      }

      const newList = TodoList.create({
        title,
        emoji: emoji || "📝",
      });

      console.log("✅ Created new list", newList.id, newList);
      me.root.todoLists.push(newList);
      console.log("📝 Added to lists, total count:", me.root.todoLists.length);
      return newList;
    },
    [me],
  );

  const addTodoItem = useCallback(
    (title: string, todoListId: string, description?: string) => {
      console.log("🔧 addTodoItem called", { title, todoListId, description });
      if (!me?.root?.todoItems) {
        console.error("❌ No root or todoItems available");
        return null;
      }

      const newItem = TodoItem.create({
        title,
        progress: 0,
        description,
        todoListId,
      });

      console.log("✅ Created new item", newItem.id, newItem);
      me.root.todoItems.push(newItem);
      console.log("📝 Added to items, total count:", me.root.todoItems.length);
      return newItem;
    },
    [me],
  );

  const updateTodoList = useCallback(
    (listId: string, changes: Partial<Pick<TodoList, "title" | "emoji">>) => {
      if (!me?.root?.todoLists) return null;

      const list = me.root.todoLists.find((l) => l?.id === listId);
      if (!list) return null;

      if (changes.title !== undefined) {
        list.title = changes.title;
      }
      if (changes.emoji !== undefined) {
        list.emoji = changes.emoji;
      }

      return list;
    },
    [me],
  );

  const updateTodoItem = useCallback(
    (
      itemId: string,
      changes: Partial<Pick<TodoItem, "title" | "progress" | "description">>,
    ) => {
      console.log("🔧 updateTodoItem called", { itemId, changes });
      if (!me?.root?.todoItems) {
        console.error("❌ No root or todoItems available");
        return null;
      }

      const item = me.root.todoItems.find((i) => i?.id === itemId);
      if (!item) {
        console.error("❌ Item not found", itemId);
        return null;
      }

      console.log("📝 Before update:", {
        title: item.title,
        progress: item.progress,
        description: item.description,
      });

      if (changes.title !== undefined) {
        item.title = changes.title;
      }
      if (changes.progress !== undefined) {
        item.progress = Math.max(0, Math.min(100, changes.progress));
      }
      if (changes.description !== undefined) {
        item.description = changes.description;
      }

      console.log("✅ After update:", {
        title: item.title,
        progress: item.progress,
        description: item.description,
      });
      return item;
    },
    [me],
  );

  const deleteTodo = useCallback(
    (todo: TodoItem) => {
      if (!me?.root?.cemetery || !me?.root?.todoItems || !todo.id) return;

      // Clone and move to cemetery
      const clone = CemeteryItem.create({
        title: todo.title,
        progress: todo.progress,
        description: todo.description,
        todoListId: todo.todoListId,
        deletedAt: new Date(),
      });

      me.root.cemetery.push(clone);

      // Remove from todoItems
      const index = me.root.todoItems.findIndex((item) => item?.id === todo.id);
      if (index !== -1) {
        me.root.todoItems.splice(index, 1);
      }
    },
    [me],
  );

  const deleteList = useCallback(
    (todoListId: string) => {
      if (!me?.root?.todoItems || !me?.root?.todoLists || !me?.root?.cemetery)
        return;

      // Move all items from this list to cemetery
      const itemsToDelete = me.root.todoItems.filter(
        (item) => item?.todoListId === todoListId,
      );

      itemsToDelete.forEach((item) => {
        if (item) {
          const clone = CemeteryItem.create({
            title: item.title,
            progress: item.progress,
            description: item.description,
            todoListId: item.todoListId,
            deletedAt: new Date(),
          });
          me.root.cemetery.push(clone);
        }
      });

      // Remove items from todoItems (filter out items belonging to this list)
      const itemsToKeep = me.root.todoItems.filter(
        (item) => item?.todoListId !== todoListId,
      );

      // Clear and repopulate the list
      me.root.todoItems.splice(0, me.root.todoItems.length, ...itemsToKeep);

      // Remove the list itself
      const listIndex = me.root.todoLists.findIndex(
        (list) => list?.id === todoListId,
      );
      if (listIndex !== -1) {
        me.root.todoLists.splice(listIndex, 1);
      }
    },
    [me],
  );

  const initializeAccount = useCallback(() => {
    console.log("🔧 initializeAccount called", {
      hasMe: !!me,
      hasRoot: !!me?.root,
    });
    if (!me || me.root) return;

    console.log("✅ Initializing account root");
    me.root = initializeAccountRoot();
    console.log("📝 Account root initialized", me.root);
  }, [me]);

  return {
    addTodoList,
    addTodoItem,
    updateTodoList,
    updateTodoItem,
    deleteTodo,
    deleteList,
    initializeAccount,
  };
}

// Compatibility exports
export {
  useJazzActions as useActions,
  useJazzCemeteryItems as useCemeteryItems,
  useJazzTodoItems as useTodoItems,
  useJazzTodoItemsWhere as useTodoItemsWhere,
  useJazzTodoLists as useTodoLists,
};
