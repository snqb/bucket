import {
  createMergeableStore,
  createIndexes,
  createRelationships,
} from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { Buffer } from "buffer";

// Ensure Buffer is available globally for bip39
if (typeof globalThis !== "undefined" && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

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

// User authentication with BIP-style passphrases
let currentUserId: string | null = null;
let currentPassphrase: string | null = null;
let currentPersister: any = null;

// Export for testing
export const getCurrentPersister = () => currentPersister;

// Generate a new passphrase
export const generatePassphrase = (): string => {
  return generateMnemonic(128); // 12 words
};

// Derive user ID from passphrase using Web Crypto API
export const deriveUserId = async (passphrase: string): Promise<string> => {
  const seed = mnemonicToSeedSync(passphrase);
  const hashBuffer = await crypto.subtle.digest("SHA-256", seed);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.substring(0, 16);
};

// Set user from passphrase
export const setUser = async (passphrase: string) => {
  console.log("🔐 Setting user with passphrase...");

  try {
    // Stop existing persister if any
    if (currentPersister) {
      await currentPersister.stopAutoLoad();
      await currentPersister.stopAutoSave();
    }

    // Clear store data when switching users
    store.delTables();

    currentPassphrase = passphrase;
    currentUserId = await deriveUserId(passphrase);

    // Save auth to localStorage first
    localStorage.setItem("bucket-auth-userId", currentUserId);
    localStorage.setItem("bucket-auth-passphrase", passphrase);

    console.log("🔐 User set:", currentUserId);

    // FIRST: Try to load from server via sync
    console.log("🔄 Attempting to load data from server...");
    let serverDataLoaded = false;

    try {
      const syncStarted = await startSync();
      if (syncStarted) {
        // Wait for initial sync data
        console.log("⏳ Waiting for server data...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const listsFromServer = store.getRowIds("lists").length;
        const tasksFromServer = store.getRowIds("tasks").length;

        if (listsFromServer > 0 || tasksFromServer > 0) {
          serverDataLoaded = true;
          console.log(
            `✅ Server data loaded: ${listsFromServer} lists, ${tasksFromServer} tasks`,
          );
        } else {
          console.log("📭 No data on server (new user or empty)");
        }
      }
    } catch (syncError) {
      console.log(
        "📱 Sync failed, falling back to local-only mode:",
        syncError.message,
      );
    }

    // SECOND: Set up localStorage persister
    const userStorageKey = `bucket-app-${currentUserId}`;
    currentPersister = createLocalPersister(store, userStorageKey);

    if (!serverDataLoaded) {
      // Only load from localStorage if no server data
      console.log("📱 Loading from localStorage...");
      await currentPersister.startAutoLoad();
    } else {
      console.log("🔄 Skipping localStorage load - using server data");
    }

    // Always start auto-save for future changes
    currentPersister.startAutoSave();

    console.log("🔐 Using storage key:", userStorageKey);

    // Log final data state
    const listsCount = store.getRowIds("lists").length;
    const tasksCount = store.getRowIds("tasks").length;
    console.log(`📊 Final data: ${listsCount} lists, ${tasksCount} tasks`);

    return currentUserId;
  } catch (error) {
    console.error("🔐 Error setting user:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  const lsUserId = localStorage.getItem("bucket-auth-userId");
  const lsPassphrase = localStorage.getItem("bucket-auth-passphrase");
  const storeUserId = store.getValue("userId");
  const storePassphrase = store.getValue("passphrase");

  return {
    userId:
      currentUserId ||
      lsUserId ||
      (typeof storeUserId === "string" ? storeUserId : ""),
    passphrase:
      currentPassphrase ||
      lsPassphrase ||
      (typeof storePassphrase === "string" ? storePassphrase : ""),
  };
};

// Logout user
export const logout = async () => {
  console.log("🔐 Starting logout...");

  try {
    // Stop sync first
    await stopSync();

    // Stop current persister
    if (currentPersister) {
      await currentPersister.stopAutoLoad();
      await currentPersister.stopAutoSave();
      currentPersister = null;
    }

    // Clear store data
    store.delTables();

    // Clear in-memory state
    currentUserId = null;
    currentPassphrase = null;

    // Clear localStorage
    localStorage.removeItem("bucket-auth-userId");
    localStorage.removeItem("bucket-auth-passphrase");

    console.log("🔐 User logged out successfully");
  } catch (error) {
    console.error("🔐 Error during logout:", error);
  }
};

// Generate QR code data for passphrase
export const generateQRData = (passphrase: string): string => {
  return `bucket-app:${passphrase}`;
};

// Parse QR code data
export const parseQRData = (qrData: string): string | null => {
  if (qrData.startsWith("bucket-app:")) {
    return qrData.substring(11);
  }
  return null;
};

// Sync configuration
let synchronizer: any = null;
export const WS_SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "wss://bucket-sync-production.up.railway.app"
    : "ws://localhost:8040"; // Force production for testing

// Start sync with user isolation
export const startSync = async (wsUrl = WS_SERVER_URL) => {
  if (!currentUserId) {
    console.log("❌ No user set for sync");
    return null;
  }

  if (synchronizer) {
    console.log("🔄 Destroying existing synchronizer...");
    await synchronizer.destroy();
  }

  try {
    // Use userId as the path for user isolation
    const ws = new WebSocket(`${wsUrl}/${currentUserId}`);
    console.log(`🔄 Attempting to connect to: ${wsUrl}/${currentUserId}`);

    // Wait for connection
    await new Promise((resolve, reject) => {
      ws.onopen = () => {
        console.log(`🔄 WebSocket connected for user: ${currentUserId}`);
        resolve(void 0);
      };
      ws.onerror = (error) => {
        console.log(`❌ WebSocket error:`, error);
        reject(error);
      };
      ws.onclose = (event) => {
        console.log(`🔄 WebSocket closed:`, event.code, event.reason);
        if (event.code !== 1000) {
          console.log(`⚠️ Unexpected close code: ${event.code}`);
        }
      };
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });

    synchronizer = await createWsSynchronizer(store, ws);

    // Add sync event listeners for debugging
    synchronizer.addStatusListener((status) => {
      console.log(`🔄 Sync status changed: ${status}`);
    });

    await synchronizer.startSync();
    console.log(`🔄 Sync started for user: ${currentUserId}`);

    // Log initial data state
    const listsCount = store.getRowIds("lists").length;
    const tasksCount = store.getRowIds("tasks").length;
    console.log(`📊 Initial data: ${listsCount} lists, ${tasksCount} tasks`);

    return synchronizer;
  } catch (error) {
    console.log("📱 Running in local-only mode (no sync server)", error);
    return null;
  }
};

// Stop sync
export const stopSync = async () => {
  if (synchronizer) {
    console.log("🔄 Stopping sync...");
    await synchronizer.destroy();
    synchronizer = null;
    console.log("🔄 Sync stopped successfully");
  }
};

// Get sync status
export const getSyncStatus = () => {
  const status = synchronizer ? "connected" : "disconnected";
  console.log(`🔄 Sync status requested: ${status}`);
  return status;
};

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

// Simple initialization
const initializeStore = async () => {
  try {
    // Initialize device ID if not set
    if (!store.getValue("deviceId")) {
      store.setValue("deviceId", generateId());
    }

    // Check for existing user in localStorage only
    const userId = localStorage.getItem("bucket-auth-userId");
    const passphrase = localStorage.getItem("bucket-auth-passphrase");

    if (
      userId &&
      passphrase &&
      typeof userId === "string" &&
      typeof passphrase === "string" &&
      userId.trim() &&
      passphrase.trim()
    ) {
      // Restore user session with proper persistence
      await setUser(passphrase);
    }
  } catch (error) {
    console.error("Failed to initialize store:", error);
  }
};

// Initialize immediately
initializeStore();

// Export function to wait for initialization
export const waitForAuth = () => Promise.resolve();

// Health check and recovery mechanisms
const runHealthCheck = () => {
  const user = getCurrentUser();
  if (!user.userId || !user.passphrase) {
    console.warn("🔐 Health check: No user data found");
    return false;
  }

  // Check if store has basic structure
  const lists = store.getRowIds("lists");
  const tasks = store.getRowIds("tasks");

  console.log(`🔍 Health check: ${lists.length} lists, ${tasks.length} tasks`);

  // Check for data consistency
  let orphanedTasks = 0;
  tasks.forEach((taskId) => {
    const task = store.getRow("tasks", taskId);
    if (task && !lists.includes(String(task.listId))) {
      orphanedTasks++;
    }
  });

  if (orphanedTasks > 0) {
    console.warn(`🔍 Health check: Found ${orphanedTasks} orphaned tasks`);
  }

  return true;
};

// Start periodic health checks after initialization
setTimeout(() => {
  runHealthCheck();
  // Run health check every 30 seconds
  setInterval(runHealthCheck, 30000);
}, 5000);
