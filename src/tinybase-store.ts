import {
  createMergeableStore,
  createIndexes,
  createRelationships,
} from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";

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

// Set up persistence to localStorage
export const persister = createLocalPersister(store, "bucket-app");
persister.startAutoLoad();
persister.startAutoSave();

// User authentication with BIP-style passphrases
let currentUserId: string | null = null;
let currentPassphrase: string | null = null;

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
  currentPassphrase = passphrase;
  currentUserId = await deriveUserId(passphrase);

  // Update store values
  store.setValue("userId", currentUserId);
  store.setValue("passphrase", passphrase);

  console.log(`🔐 User set: ${currentUserId}`);

  // Start sync after user is set
  setTimeout(() => {
    startSync().catch(console.error);
  }, 100);

  return currentUserId;
};

// Get current user
export const getCurrentUser = () => {
  return {
    userId: currentUserId,
    passphrase: currentPassphrase,
  };
};

// Logout user
export const logout = async () => {
  // Stop sync first
  await stopSync();

  // Clear in-memory state
  currentUserId = null;
  currentPassphrase = null;

  // Clear store values
  store.setValue("userId", "");
  store.setValue("passphrase", "");

  // Clear all data from store
  store.delTables();
  store.delValues();

  // Clear localStorage
  localStorage.removeItem("bucket-app");

  console.log("🔐 User logged out");
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
export const WS_SERVER_URL = "ws://localhost:8040";

// Start sync with user isolation
export const startSync = async (wsUrl = WS_SERVER_URL) => {
  if (!currentUserId) {
    console.log("❌ No user set for sync");
    return null;
  }

  if (synchronizer) {
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
      };
      setTimeout(() => reject(new Error("Connection timeout")), 5000);
    });

    synchronizer = await createWsSynchronizer(store, ws);
    await synchronizer.startSync();
    console.log(`🔄 Sync started for user: ${currentUserId}`);
    return synchronizer;
  } catch (error) {
    console.log("📱 Running in local-only mode (no sync server)", error);
    return null;
  }
};

// Stop sync
export const stopSync = async () => {
  if (synchronizer) {
    await synchronizer.destroy();
    synchronizer = null;
    console.log("🔄 Sync stopped");
  }
};

// Get sync status
export const getSyncStatus = () => {
  return synchronizer ? "connected" : "disconnected";
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

// Initialize device ID if not set
if (!store.getValue("deviceId")) {
  store.setValue("deviceId", generateId());
}

// Initialize user after persister loads data
persister.startAutoLoad().then(async () => {
  const storedPassphrase = store.getValue("passphrase");
  if (
    storedPassphrase &&
    typeof storedPassphrase === "string" &&
    storedPassphrase.trim() !== ""
  ) {
    await setUser(storedPassphrase);
    // Sync will be started by setUser
  }
});
