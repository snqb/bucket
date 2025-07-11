import {
  useRowIds,
  useRow,
  useCell,
  useValue,
  useSliceRowIds,
  useTable,
} from "tinybase/ui-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  store,
  indexes,
  createList,
  createTask,
  updateTask,
  deleteTask,
  deleteList,
  getListTasks,
  startSync,
  stopSync,
  getSyncStatus,
  getCurrentUser,
  setUser,
  logout as storeLogout,
  waitForAuth,
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

// Hook to manage sync state
export const useSync = (wsUrl?: string) => {
  const [syncStatus, setSyncStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [user, setUserState] = useState(getCurrentUser());

  const connect = useCallback(async () => {
    if (syncStatus === "connecting") return;

    const currentUser = getCurrentUser();
    if (!currentUser.userId) {
      setError("No user authenticated");
      return;
    }

    setSyncStatus("connecting");
    setError(null);

    try {
      const synchronizer = await startSync(wsUrl);
      setSyncStatus(synchronizer ? "connected" : "disconnected");
      if (!synchronizer) {
        setError("Failed to connect to sync server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setSyncStatus("disconnected");
    }
  }, [wsUrl, syncStatus]);

  const disconnect = useCallback(async () => {
    try {
      await stopSync();
      setSyncStatus("disconnected");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }, []);

  // Update status on component mount
  useEffect(() => {
    setSyncStatus(getSyncStatus());
    setUserState(getCurrentUser());
  }, []);

  return {
    syncStatus,
    error,
    connect,
    disconnect,
    isConnected: syncStatus === "connected",
    isConnecting: syncStatus === "connecting",
    user,
    hasUser: !!user.userId,
  };
};

// Hook to manage user authentication
export const useAuth = () => {
  const userId = useValue("userId", store);
  const passphrase = useValue("passphrase", store);
  const [isLoading, setIsLoading] = useState(true);

  const user = useMemo(() => {
    return {
      userId: (typeof userId === "string" && userId) || "",
      passphrase: (typeof passphrase === "string" && passphrase) || "",
    };
  }, [userId, passphrase]);

  // Wait for store to be ready and auth values to be loaded
  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for persister to load data
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if we have auth data in store
      const storedUserId = store.getValue("userId");
      const storedPassphrase = store.getValue("passphrase");

      if (
        storedUserId &&
        storedPassphrase &&
        typeof storedUserId === "string" &&
        typeof storedPassphrase === "string" &&
        storedUserId.trim() &&
        storedPassphrase.trim()
      ) {
        // Auth data is available, we're ready
        setIsLoading(false);
      } else {
        // No auth data, also ready (will show login)
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Also check when userId or passphrase values change
  useEffect(() => {
    if (userId || passphrase) {
      setIsLoading(false);
    }
  }, [userId, passphrase]);

  const authenticate = useCallback(async (passphrase: string) => {
    const userId = await setUser(passphrase);
    return userId;
  }, []);

  const logout = useCallback(() => {
    storeLogout();
  }, []);

  return {
    user,
    authenticate,
    logout,
    isAuthenticated: !!user.userId && !!user.passphrase,
    isLoading,
  };
};
