/**
 * Persistence module - localStorage-based data persistence
 *
 * Handles:
 * - TinyBase persister creation and lifecycle
 * - Auto-save on data changes
 * - Loading data from localStorage
 * - User-specific storage keys
 */

import { createLocalPersister } from 'tinybase/persisters/persister-browser';
import type { MergeableStore } from 'tinybase';

class PersistenceManager {
  private persister: any = null;
  private currentUserId: string | null = null;

  /**
   * Initialize persistence for a user
   * Creates persister, loads existing data, and starts auto-save
   */
  async initialize(store: MergeableStore, userId: string): Promise<void> {
    // Stop existing persister if switching users
    if (this.persister && this.currentUserId !== userId) {
      console.log('🔄 Switching users, stopping previous persister...');
      await this.stop();
    }

    // Skip if already initialized for this user
    if (this.persister && this.currentUserId === userId) {
      console.log('💾 Persister already initialized for this user');
      return;
    }

    const storageKey = `bucket-data-${userId}`;
    console.log('💾 Initializing persistence:', storageKey);

    try {
      // Create persister
      this.persister = createLocalPersister(store, storageKey);
      this.currentUserId = userId;

      // Load existing data
      await this.persister.load();
      console.log('💾 Loaded data from localStorage');

      // Start auto-save
      await this.persister.startAutoSave();
      console.log('💾 Auto-save enabled');
    } catch (error) {
      console.error('💾 Failed to initialize persistence:', error);
      throw error;
    }
  }

  /**
   * Stop persistence (on logout or user switch)
   */
  async stop(): Promise<void> {
    if (!this.persister) {
      return;
    }

    console.log('💾 Stopping persistence...');

    try {
      await this.persister.stopAutoLoad();
      await this.persister.stopAutoSave();
      this.persister = null;
      this.currentUserId = null;
      console.log('💾 Persistence stopped');
    } catch (error) {
      console.error('💾 Error stopping persistence:', error);
      // Don't throw - we want to continue cleanup even if this fails
    }
  }

  /**
   * Manually save current state
   * Useful for forcing a save before critical operations
   */
  async save(): Promise<void> {
    if (!this.persister) {
      console.warn('💾 No persister initialized, cannot save');
      return;
    }

    try {
      await this.persister.save();
      console.log('💾 Manual save complete');
    } catch (error) {
      console.error('💾 Failed to save:', error);
      throw error;
    }
  }

  /**
   * Get current persister (for testing/debugging)
   */
  getPersister(): any {
    return this.persister;
  }

  /**
   * Check if persistence is active
   */
  isActive(): boolean {
    return !!this.persister;
  }
}

// Singleton instance
export const persistence = new PersistenceManager();
