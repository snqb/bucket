/**
 * Type-safe localStorage abstraction
 *
 * Benefits:
 * - Type safety: Can't typo storage keys
 * - Error handling: Graceful fallback if storage fails
 * - Easy to swap: Can move to IndexedDB later without changing call sites
 */

type StorageKey =
  | 'bucket-userId'
  | 'bucket-passphrase'
  | `bucket-data-${string}`;

class Storage {
  /**
   * Get a value from localStorage
   * Returns null if key doesn't exist or storage fails
   */
  get(key: StorageKey): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Storage get failed for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in localStorage
   * Fails silently if storage quota exceeded or unavailable
   */
  set(key: StorageKey, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Storage set failed for ${key}:`, error);
      // TODO: Show user-facing error for quota exceeded
    }
  }

  /**
   * Remove a value from localStorage
   */
  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage remove failed for ${key}:`, error);
    }
  }

  /**
   * Check if user has any stored data
   */
  hasDataFor(userId: string): boolean {
    return this.get(`bucket-data-${userId}`) !== null;
  }

  /**
   * Check if any user data exists in storage
   */
  hasAnyUserData(): boolean {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bucket-data-')) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to check for user data:', error);
      return false;
    }
  }

  /**
   * Clear all Bucket-related data
   * Use with caution - for debugging/logout
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bucket-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️ Cleared ${keysToRemove.length} storage keys`);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

// Singleton instance
export const storage = new Storage();
