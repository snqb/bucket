import {
  createMergeableStore,
  createIndexes,
  createRelationships,
} from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// Create the main store as MergeableStore for sync support
export const store = createMergeableStore()
  .setTablesSchema({
    lists: {
      id: { type: "string" },
      title: { type: "string" },
      emoji: { type: "string", default: "📋" },
      color: { type: "string", default: "#3B82F6" },
      createdAt: { type: "number" },
    },
    tasks: {
      id: { type: "string" },
      listId: { type: "string" },
      title: { type: "string" },
      description: { type: "string", default: "" },
      progress: { type: "number", default: 0 },
      completed: { type: "boolean", default: false },
      createdAt: { type: "number" },
      updatedAt: { type: "number" },
    },
    cemetery: {
      id: { type: "string" },
      originalTitle: { type: "string" },
      originalDescription: { type: "string" },
      originalProgress: { type: "number" },
      deletedAt: { type: "number" },
      deletionReason: { type: "string", default: "deleted" },
    },
  })
  .setValuesSchema({
    lastSync: { type: "number", default: 0 },
    deviceId: { type: "string", default: "" },
    userId: { type: "string", default: "" },
    passphrase: { type: "string", default: "" },
  });

// Create indexes for better performance
export const indexes = createIndexes(store);
indexes.setIndexDefinition("tasksByList", "tasks", "listId");
indexes.setIndexDefinition("completedTasks", "tasks", "completed");

// Create relationships
export const relationships = createRelationships(store);
relationships.setRelationshipDefinition(
  "listTasks",
  "lists",
  "tasks",
  "listId",
);

// Local state
let currentUserId: string | null = null;
let currentPassphrase: string | null = null;
let currentPersister: any = null;
let currentSynchronizer: any = null;
let syncWebSocket: WebSocket | null = null;

// Generate a new passphrase
export const generatePassphrase = (): string => {
  try {
    const mnemonic = generateMnemonic(wordlist, 128); // 12 words
    console.log("🎲 Generated passphrase:", mnemonic);

    if (!mnemonic) {
      throw new Error("Failed to generate mnemonic");
    }

    // Validate it has 12 words
    const words = mnemonic.split(" ");
    if (words.length !== 12) {
      throw new Error(
        `Generated mnemonic has ${words.length} words, expected 12`,
      );
    }

    return mnemonic;
  } catch (error) {
    console.error("🔴 Passphrase generation error:", error);
    throw error;
  }
};

// Derive user ID from passphrase
export const deriveUserId = async (passphrase: string): Promise<string> => {
  try {
    if (!passphrase) {
      throw new Error("Cannot derive user ID from empty passphrase");
    }

    // mnemonicToSeed returns a Promise<Uint8Array>
    const seed = await mnemonicToSeed(passphrase);

    // crypto.subtle.digest accepts Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", seed);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const userId = hashHex.substring(0, 16);

    console.log("🔑 Derived user ID:", userId);
    return userId;
  } catch (error) {
    console.error("🔴 User ID derivation error:", error);
    throw error;
  }
};

// Initialize or switch user - LOCAL FIRST
export const setUser = async (passphrase: string) => {
  console.log("🔐 Setting user with passphrase...");

  if (!passphrase || typeof passphrase !== "string") {
    throw new Error("Invalid passphrase: must be a non-empty string");
  }

  const trimmed = passphrase.trim();
  if (!trimmed) {
    throw new Error("Invalid passphrase: cannot be empty");
  }

  console.log("🔐 Passphrase word count:", trimmed.split(/\s+/).length);

  const newUserId = await deriveUserId(trimmed);

  // If same user, just ensure persister is running
  if (currentUserId === newUserId && currentPersister) {
    console.log("🔐 Same user, ensuring persistence...");
    return currentUserId;
  }

  // Stop current persister and sync if switching users
  if (currentPersister) {
    await currentPersister.stopAutoLoad();
    await currentPersister.stopAutoSave();
  }

  // Disconnect sync if active
  await disconnectSync();

  // Clear store data only when switching users
  if (currentUserId && currentUserId !== newUserId) {
    store.delTables();
  }

  // Update state
  currentUserId = newUserId;
  currentPassphrase = passphrase;

  // Save to localStorage for persistence
  localStorage.setItem("bucket-userId", currentUserId);
  localStorage.setItem("bucket-passphrase", passphrase);

  // Create local persister - this is our source of truth
  const storageKey = `bucket-data-${currentUserId}`;
  currentPersister = createLocalPersister(store, storageKey);

  // Load existing local data
  await currentPersister.load();

  // Check if we have local data
  const hasLocalData =
    store.getRowIds("lists").length > 0 || store.getRowIds("tasks").length > 0;

  // If no local data, try to sync from server first
  if (!hasLocalData) {
    console.log("📭 No local data found, attempting to sync from server...");
    try {
      await connectSync(true); // true = initial sync
      // Wait for data to arrive
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const syncedLists = store.getRowIds("lists").length;
      const syncedTasks = store.getRowIds("tasks").length;
      if (syncedLists > 0 || syncedTasks > 0) {
        console.log(
          `✅ Synced ${syncedLists} lists and ${syncedTasks} tasks from server`,
        );
        // Save the synced data locally
        await currentPersister.save();
      }
    } catch (error) {
      console.log("📱 Could not sync from server, starting fresh:", error);
    }
  }

  // Start auto-save
  await currentPersister.startAutoSave();

  // Update store values
  store.setValue("userId", currentUserId);
  store.setValue("passphrase", passphrase);

  if (!store.getValue("deviceId")) {
    store.setValue("deviceId", generateId());
  }

  const listsCount = store.getRowIds("lists").length;
  const tasksCount = store.getRowIds("tasks").length;
  console.log(
    `🔐 User set: ${currentUserId} (${listsCount} lists, ${tasksCount} tasks)`,
  );

  return currentUserId;
};

// Get current user
export const getCurrentUser = () => {
  return {
    userId: currentUserId || localStorage.getItem("bucket-userId") || "",
    passphrase:
      currentPassphrase || localStorage.getItem("bucket-passphrase") || "",
  };
};

// Logout
export const logout = async () => {
  console.log("🔐 Logging out...");

  // Stop persister
  if (currentPersister) {
    await currentPersister.stopAutoLoad();
    await currentPersister.stopAutoSave();
    currentPersister = null;
  }

  // Disconnect sync
  await disconnectSync();

  // Clear state
  currentUserId = null;
  currentPassphrase = null;

  // Clear localStorage
  localStorage.removeItem("bucket-userId");
  localStorage.removeItem("bucket-passphrase");

  // Clear store
  store.delTables();

  console.log("🔐 Logged out");
};

// Sync configuration
export const WS_SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "wss://bucket-sync-production.up.railway.app"
    : "ws://localhost:8040";

// Connect sync (called manually or on data change)
export const connectSync = async (isInitialSync = false): Promise<boolean> => {
  if (!currentUserId) {
    console.log("❌ No user to sync");
    return false;
  }

  if (currentSynchronizer) {
    console.log("🔄 Sync already connected");
    return true;
  }

  try {
    // Create WebSocket with user path
    syncWebSocket = new WebSocket(`${WS_SERVER_URL}/${currentUserId}`);

    // Expose WebSocket for debugging
    // @ts-ignore
    window.__syncWebSocket = syncWebSocket;

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timeout")),
        5000,
      );

      syncWebSocket!.onopen = () => {
        clearTimeout(timeout);
        console.log("🔄 Sync connected");
        resolve();
      };

      syncWebSocket!.onerror = (error) => {
        clearTimeout(timeout);
        console.error("🔄 WebSocket error:", error);
        reject(new Error("WebSocket connection failed"));
      };

      syncWebSocket!.onclose = (event) => {
        clearTimeout(timeout);
        if (!event.wasClean) {
          console.error(
            "🔄 WebSocket closed unexpectedly:",
            event.code,
            event.reason,
          );
        }
      };
    });

    // Create synchronizer with proper configuration
    currentSynchronizer = await createWsSynchronizer(
      store,
      syncWebSocket,
      5, // Request timeout in seconds
      undefined, // onSend callback (optional)
      undefined, // onReceive callback (optional)
      (error) => console.error("🔄 Sync error ignored:", error),
    );

    // Safety check: Don't sync empty store unless it's initial sync
    const listsCount = store.getRowIds("lists").length;
    const tasksCount = store.getRowIds("tasks").length;

    if (!isInitialSync && listsCount === 0 && tasksCount === 0) {
      console.log("⚠️ Preventing sync of empty store to avoid data loss");
      await disconnectSync();
      return false;
    }

    // For initial sync, wait for server data before allowing local changes to sync
    if (isInitialSync) {
      let receivedInitialData = false;
      let dataReceived = { lists: 0, tasks: 0 };

      // Listen for incoming data
      const listenerId = store.addTablesListener(() => {
        if (!receivedInitialData) {
          receivedInitialData = true;
          dataReceived.lists = store.getRowIds("lists").length;
          dataReceived.tasks = store.getRowIds("tasks").length;
          console.log(
            `🔄 Received initial sync data: ${dataReceived.lists} lists, ${dataReceived.tasks} tasks`,
          );
        }
      });

      // Start sync - this should request full state from server
      console.log("🔄 Starting initial sync, requesting server data...");
      await currentSynchronizer.startSync();

      // Wait longer for initial data to arrive
      let waitTime = 0;
      const maxWait = 10000; // 10 seconds max
      const checkInterval = 500; // Check every 500ms

      while (waitTime < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;

        const currentLists = store.getRowIds("lists").length;
        const currentTasks = store.getRowIds("tasks").length;

        if (currentLists > 0 || currentTasks > 0) {
          console.log(
            `✅ Sync data received after ${waitTime}ms: ${currentLists} lists, ${currentTasks} tasks`,
          );
          break;
        }

        if (waitTime % 2000 === 0) {
          console.log(`⏳ Waiting for server data... ${waitTime / 1000}s`);
        }
      }

      // Clean up listener
      if (listenerId) {
        store.delListener(listenerId);
      }

      if (waitTime >= maxWait) {
        console.log(
          "⚠️ Timeout waiting for server data - server might be empty or connection slow",
        );
      }
    } else {
      await currentSynchronizer.startSync();
    }

    // Update last sync time
    store.setValue("lastSync", Date.now());

    return true;
  } catch (error) {
    console.error("🔄 Sync connection failed:", error);
    // Clean up on error
    if (syncWebSocket) {
      try {
        syncWebSocket.close();
      } catch (e) {
        // Ignore close errors
      }
      syncWebSocket = null;
    }
    currentSynchronizer = null;
    throw error;
  }
};

// Disconnect sync
export const disconnectSync = async () => {
  if (currentSynchronizer) {
    await currentSynchronizer.destroy();
    currentSynchronizer = null;
  }

  if (syncWebSocket) {
    syncWebSocket.close();
    syncWebSocket = null;
    // @ts-ignore
    window.__syncWebSocket = null;
  }

  console.log("🔄 Sync disconnected");
};

// Get sync status
export const getSyncStatus = () => {
  return {
    connected: !!currentSynchronizer,
    lastSync: (store.getValue("lastSync") as number) || 0,
  };
};

// Manual sync trigger
export const syncNow = async (): Promise<boolean> => {
  console.log("🔄 Manual sync triggered");

  // Disconnect if already connected
  await disconnectSync();

  // Check if we have any local data
  const hasData =
    store.getRowIds("lists").length > 0 || store.getRowIds("tasks").length > 0;

  // Connect and sync (not initial sync if we have data)
  try {
    // Always do initial sync when manually syncing to ensure we get latest server data
    const connected = await connectSync(true);

    if (connected) {
      // Keep connection open for a bit longer to ensure full sync
      setTimeout(() => {
        if (!autoSyncEnabled) {
          console.log("🔄 Manual sync complete, disconnecting...");
          disconnectSync();
        }
      }, 5000);

      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return false;
  }
};

// Auto-sync on changes
let autoSyncEnabled = true;
let syncDebounceTimer: NodeJS.Timeout | null = null;

export const setAutoSync = (enabled: boolean) => {
  autoSyncEnabled = enabled;
  if (!enabled) {
    disconnectSync();
  }
};

// Sync on data change (debounced)
const syncOnChange = () => {
  if (!autoSyncEnabled || !currentUserId) return;

  // Clear existing timer
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  // Debounce sync to avoid too many connections
  syncDebounceTimer = setTimeout(async () => {
    // Safety check: Don't auto-sync if store is empty
    const hasData =
      store.getRowIds("lists").length > 0 ||
      store.getRowIds("tasks").length > 0;

    if (!hasData) {
      console.log("⚠️ Skipping auto-sync of empty store");
      return;
    }

    try {
      await connectSync();
    } catch (error) {
      console.error("🔄 Auto-sync failed:", error);
    }
  }, 1000);
};

// Listen for store changes
let isInitialized = false;
store.addTablesListener(() => {
  // Don't sync on the very first change (might be initial load)
  if (!isInitialized) {
    isInitialized = true;
    return;
  }
  syncOnChange();
});

// Helper functions
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const createList = (title: string, emoji?: string, color?: string) => {
  const id = generateId();
  store.setRow("lists", id, {
    id,
    title,
    emoji: emoji || "📋",
    color: color || "#3B82F6",
    createdAt: Date.now(),
  });
  return id;
};

export const createTask = (
  listId: string,
  title: string,
  description?: string,
) => {
  const id = generateId();
  const now = Date.now();
  store.setRow("tasks", id, {
    id,
    listId,
    title,
    description: description || "",
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
  const current = store.getRow("tasks", id);
  if (!current) return;

  store.setRow("tasks", id, {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteTask = (id: string, reason?: string) => {
  const task = store.getRow("tasks", id);
  if (!task) return;

  // Move to cemetery
  const cemeteryId = generateId();
  store.setRow("cemetery", cemeteryId, {
    id: cemeteryId,
    originalTitle: task.title as string,
    originalDescription: task.description as string,
    originalProgress: task.progress as number,
    deletedAt: Date.now(),
    deletionReason: reason || "deleted",
  });

  // Remove from tasks
  store.delRow("tasks", id);
};

export const deleteList = (id: string) => {
  // Delete all tasks in this list
  const tasks = store.getRowIds("tasks");
  tasks.forEach((taskId) => {
    const task = store.getRow("tasks", taskId);
    if (task?.listId === id) {
      deleteTask(taskId, "list deleted");
    }
  });

  // Delete the list
  store.delRow("lists", id);
};

export const getListTasks = (listId: string) => {
  return indexes.getSliceRowIds("tasksByList", listId);
};

export const getCompletedTasks = () => {
  return indexes.getSliceRowIds("completedTasks", "true");
};

// Initialize on import
const initialize = async () => {
  // Check for existing auth
  const savedUserId = localStorage.getItem("bucket-userId");
  const savedPassphrase = localStorage.getItem("bucket-passphrase");

  if (savedUserId && savedPassphrase) {
    try {
      await setUser(savedPassphrase);
      console.log("🔐 Restored user session");
    } catch (error) {
      console.error("🔐 Failed to restore session:", error);
    }
  }
};

// Initialize
initialize();

// Export for testing
export const getCurrentPersister = () => currentPersister;
export const waitForAuth = () => Promise.resolve();

// QR code helpers
export const generateQRData = (passphrase: string): string => {
  return `bucket-app:${passphrase}`;
};

export const parseQRData = (qrData: string): string | null => {
  if (qrData.startsWith("bucket-app:")) {
    return qrData.substring(11);
  }
  return null;
};
