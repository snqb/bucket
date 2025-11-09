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
  getSyncStatus,
  syncNow,
  getCurrentUser,
  setUser,
  logout as storeLogout,
  waitForAuth,
  restoreFromCemetery,
  permanentlyDelete,
} from "./tinybase-store";
import { syncManager } from "./lib/sync";

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
    restoreFromCemetery,
    permanentlyDelete,

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
export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<
    "connected" | "disconnected" | "connecting" | "syncing"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number>(0);
  const [user, setUserState] = useState(getCurrentUser());
  const [syncInProgress, setSyncInProgress] = useState(false);

  const updateStatus = useCallback(() => {
    const { status, lastSync: lastSyncTime } = getSyncStatus();

    // Map syncManager status to UI status
    if (status === 'connecting') {
      setSyncStatus('connecting');
    } else if (status === 'connected') {
      setSyncStatus('connected');
    } else if (status === 'error') {
      setSyncStatus('disconnected');
    } else {
      setSyncStatus('disconnected');
    }

    setLastSync(lastSyncTime);
    setSyncInProgress(status === 'connecting');
  }, []);

  const manualSync = useCallback(async () => {
    if (syncStatus === "connecting" || syncStatus === "syncing") return;

    const currentUser = getCurrentUser();
    if (!currentUser.userId) {
      setError("No user authenticated");
      return;
    }

    setSyncStatus("connecting");
    setError(null);

    try {
      const success = await syncNow();
      if (success) {
        setSyncStatus("syncing");
        // Status will update to "connected" when sync completes
      } else {
        setSyncStatus("disconnected");
        setError("Failed to sync");
      }
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
      setSyncStatus("disconnected");
    }
  }, [syncStatus, updateStatus]);

  // Update status periodically - more frequent during sync
  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, syncInProgress ? 1000 : 5000);
    return () => clearInterval(interval);
  }, [updateStatus, syncInProgress]);

  // Update user state on mount
  useEffect(() => {
    setUserState(getCurrentUser());
  }, []);

  return {
    syncStatus,
    error,
    syncNow: manualSync,
    isConnected: syncStatus === "connected",
    isConnecting: syncStatus === "connecting" || syncStatus === "syncing",
    isSyncing: syncStatus === "syncing",
    lastSync,
    user,
    hasUser: !!user.userId,
  };
};

// Hook to manage user authentication
export const useAuth = () => {
  const [authState, setAuthState] = useState(() => ({
    userId: localStorage.getItem("bucket-userId") || "",
    passphrase: localStorage.getItem("bucket-passphrase") || "",
  }));
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading if no user is stored
    const hasStoredUser = !!(
      localStorage.getItem("bucket-userId") &&
      localStorage.getItem("bucket-passphrase")
    );
    return !hasStoredUser;
  });

  const user = useMemo(() => {
    return {
      userId: authState.userId,
      passphrase: authState.passphrase,
    };
  }, [authState]);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      // If we have stored credentials, stop loading immediately
      if (authState.userId && authState.passphrase) {
        setIsLoading(false);
        return;
      }

      // Wait a bit for any initialization only if no stored auth
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = () => {
      setAuthState({
        userId: localStorage.getItem("bucket-userId") || "",
        passphrase: localStorage.getItem("bucket-passphrase") || "",
      });
    };

    // Check for auth changes every 100ms to catch same-tab changes
    const authCheckInterval = setInterval(() => {
      const currentUserId = localStorage.getItem("bucket-userId") || "";
      const currentPassphrase = localStorage.getItem("bucket-passphrase") || "";

      if (
        currentUserId !== authState.userId ||
        currentPassphrase !== authState.passphrase
      ) {
        setAuthState({
          userId: currentUserId,
          passphrase: currentPassphrase,
        });
      }
    }, 100);

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, [authState.userId, authState.passphrase]);

  const authenticate = useCallback(async (passphrase: string) => {
    const userId = await setUser(passphrase);
    // Update local state to reflect the auth change
    setAuthState({
      userId: userId,
      passphrase: passphrase,
    });
    return userId;
  }, []);

  const logout = useCallback(() => {
    storeLogout();
    // Update local state to reflect logout
    setAuthState({
      userId: "",
      passphrase: "",
    });
  }, []);

  return {
    user,
    authenticate,
    logout,
    isAuthenticated: !!user.userId && !!user.passphrase,
    isLoading,
  };
};
