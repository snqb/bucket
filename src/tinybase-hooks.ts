import {
  useRowIds,
  useRow,
  useCell,
  useValue,
  useSliceRowIds,
  useTable,
} from "tinybase/ui-react";
import {
  store,
  indexes,
  createList,
  createTask,
  updateTask,
  deleteTask,
  deleteList,
  getListTasks,
} from "./tinybase-store";

// Hook to get all lists
export const useLists = () => {
  const lists = useTable("lists", store);
  return Object.values(lists);
};

// Hook to get a specific list
export const useList = (listId: string) => {
  return useRow("lists", listId, store);
};

// Hook to get tasks for a specific list
export const useListTasks = (listId: string) => {
  const allTasks = useTable("tasks", store);
  return Object.values(allTasks).filter((task) => task.listId === listId);
};

// Hook to get a specific task
export const useTask = (taskId: string) => {
  return useRow("tasks", taskId, store);
};

// Hook to get all tasks
export const useTasks = () => {
  const tasks = useTable("tasks", store);
  return Object.values(tasks);
};

// Hook to get cemetery items
export const useCemeteryItems = () => {
  const cemetery = useTable("cemetery", store);
  return Object.values(cemetery);
};

// Hook to get device ID
export const useDeviceId = () => {
  return useValue("deviceId", store);
};

// Hook to get last sync time
export const useLastSync = () => {
  return useValue("lastSync", store);
};

// Actions object for easy access to store operations
export const useActions = () => {
  return {
    createList,
    createTask,
    updateTask,
    deleteTask,
    deleteList,

    // Additional convenience methods
    toggleTaskCompleted: (taskId: string) => {
      const task = store.getRow("tasks", taskId);
      if (task) {
        updateTask(taskId, { completed: !task.completed });
      }
    },

    setTaskProgress: (taskId: string, progress: number) => {
      updateTask(taskId, { progress: Math.max(0, Math.min(100, progress)) });
    },

    updateListTitle: (listId: string, title: string) => {
      const list = store.getRow("lists", listId);
      if (list) {
        store.setRow("lists", listId, { ...list, title });
      }
    },

    updateListEmoji: (listId: string, emoji: string) => {
      const list = store.getRow("lists", listId);
      if (list) {
        store.setRow("lists", listId, { ...list, emoji });
      }
    },

    updateListColor: (listId: string, color: string) => {
      const list = store.getRow("lists", listId);
      if (list) {
        store.setRow("lists", listId, { ...list, color });
      }
    },

    markCompleted: (taskId: string) => {
      updateTask(taskId, { completed: true, progress: 100 });
    },

    clearCemetery: () => {
      const cemeteryIds = store.getRowIds("cemetery");
      cemeteryIds.forEach((id) => store.delRow("cemetery", id));
    },
  };
};
