import { storage } from "./lib/storage";
import { auth } from "./lib/auth";
import { syncManager } from "./lib/sync";
import { persistence } from "./lib/persistence";
import {
  store,
  indexes,
  relationships,
  generateId,
  createList,
  createTask,
  updateTask,
  deleteTask,
  deleteList,
  getListTasks,
  getCompletedTasks,
} from "./lib/bucket-store";

// Local state
let currentUserId: string | null = null;
let currentPassphrase: string | null = null;

// Re-export auth functions for backwards compatibility
export const generatePassphrase = () => auth.generatePassphrase();
export const deriveUserId = (passphrase: string) => auth.deriveUserId(passphrase);

// Initialize or switch user - LOCAL FIRST
export const setUser = async (passphrase: string) => {
  const newUserId = await auth.setUser(passphrase);

  // If same user, just ensure persistence is active
  if (currentUserId === newUserId && persistence.isActive()) {
    console.log("🔐 Same user, already initialized");
    return currentUserId;
  }

  // Stop current persistence and sync if switching users
  if (currentUserId && currentUserId !== newUserId) {
    await persistence.stop();
    syncManager.disconnect();

    // Clear store data when switching users
    store.delTables();
    store.delValues();
    console.log("🧹 Cleared store for user switch");
  }

  // Update state
  currentUserId = newUserId;
  currentPassphrase = passphrase;

  // Initialize persistence (loads data and starts auto-save)
  await persistence.initialize(store, currentUserId);

  // Log loaded data
  const listsCount = store.getRowIds("lists").length;
  const tasksCount = store.getRowIds("tasks").length;
  console.log(
    `🔍 User: ${currentUserId.slice(0, 8)}... | Loaded: ${listsCount} lists, ${tasksCount} tasks`,
  );

  // Connect to sync server
  console.log('🔄 Connecting to sync server...');
  try {
    await syncManager.connect(store, currentUserId);
    console.log('✅ Sync connected successfully');
  } catch (error) {
    console.warn('📱 Sync connection failed, continuing offline:', error);
  }

  // Update store values
  store.setValue("userId", currentUserId);
  store.setValue("passphrase", passphrase);

  if (!store.getValue("deviceId")) {
    store.setValue("deviceId", generateId());
  }

  console.log(
    `🔐 User set: ${currentUserId} (${listsCount} lists, ${tasksCount} tasks)`,
  );

  return currentUserId;
};

// Get current user
export const getCurrentUser = () => auth.getCurrentUser();

// Logout
export const logout = async () => {
  // Stop persistence
  await persistence.stop();

  // Disconnect sync
  syncManager.disconnect();

  // Clear state
  currentUserId = null;
  currentPassphrase = null;

  // Clear auth
  auth.logout();

  // Clear store
  store.delTables();
  store.delValues();

  // Note: We don't clear user data from localStorage during logout
  // This allows the user to log back in and retrieve their data
};

// Get sync status
export const getSyncStatus = () => {
  return {
    status: syncManager.getStatus(),
    lastSync: (store.getValue("lastSync") as number) || 0,
  };
};

// Manual sync trigger (reconnect to sync server)
export const syncNow = async (): Promise<boolean> => {
  console.log('🔄 Manual sync triggered');

  if (!currentUserId) {
    console.warn('❌ No user to sync');
    return false;
  }

  try {
    // Reconnect to sync server
    syncManager.disconnect();
    await syncManager.connect(store, currentUserId);
    console.log('✅ Manual sync complete');
    store.setValue('lastSync', Date.now());
    return true;
  } catch (error) {
    console.error('🔄 Manual sync failed:', error);
    return false;
  }
};

// Re-export store, indexes, and CRUD operations (imported from bucket-store)
export {
  store,
  indexes,
  relationships,
  generateId,
  createList,
  createTask,
  updateTask,
  deleteTask,
  deleteList,
  getListTasks,
  getCompletedTasks,
  restoreFromCemetery,
  permanentlyDelete,
} from "./lib/bucket-store";

// Initialize on import
const initialize = async () => {
  // Restore auth session
  const restored = await auth.restoreSession();

  if (restored) {
    const { passphrase } = auth.getCurrentUser();
    if (passphrase) {
      try {
        await setUser(passphrase);
        console.log("🔐 Restored user session");
      } catch (error) {
        console.error("🔐 Failed to restore session:", error);
      }
    }
  }
};

// Initialize
initialize();

// Export for testing
export const getCurrentPersister = () => persistence.getPersister();
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

// Check if local data exists for current or any user
export const hasLocalData = (): boolean => {
  if (currentUserId) {
    // Check if current user has data
    const listsCount = store.getRowIds("lists").length;
    const tasksCount = store.getRowIds("tasks").length;
    return listsCount > 0 || tasksCount > 0;
  }

  // Check if any user data exists in localStorage
  return storage.hasAnyUserData();
};

// Clear all user data (for debugging/testing)
export const clearAllUserData = () => {
  storage.clear();
};
