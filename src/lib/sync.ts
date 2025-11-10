/**
 * Sync module - WebSocket-based real-time synchronization
 *
 * Handles:
 * - WebSocket connection lifecycle
 * - TinyBase synchronizer creation
 * - Auto-reconnect on disconnect
 * - Observable sync status
 */

import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';
import type { MergeableStore } from 'tinybase';

const WS_SERVER_URL =
  import.meta.env.MODE === 'production'
    ? 'wss://bucket-sync-production.up.railway.app'
    : 'ws://localhost:8040';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class SyncManager {
  private ws: WebSocket | null = null;
  private synchronizer: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private status: SyncStatus = 'disconnected';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private currentUserId: string | null = null;
  private currentStore: MergeableStore | null = null;

  /**
   * Connect to sync server and start synchronization
   */
  async connect(store: MergeableStore, userId: string): Promise<void> {
    // Already connected to the same user
    if (this.synchronizer && this.currentUserId === userId) {
      console.log('🔄 Already connected to sync server');
      return;
    }

    // Disconnect if switching users
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log('🔄 Switching users, disconnecting first...');
      this.disconnect();
    }

    this.currentUserId = userId;
    this.currentStore = store;
    this.setStatus('connecting');

    try {
      // Create WebSocket connection
      const wsUrl = `${WS_SERVER_URL}/${userId}`;

      this.ws = new WebSocket(wsUrl);

      // Wait for WebSocket to open
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Sync server unavailable (offline mode)'));
        }, 3000); // Faster timeout for better UX

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          reject(new Error('Sync server unavailable (offline mode)'));
        };
      });

      // Create TinyBase synchronizer
      this.synchronizer = await createWsSynchronizer(store, this.ws, 5);
      await this.synchronizer.startSync();

      this.setStatus('connected');
      this.scheduleReconnect();

    } catch (error) {
      console.error('🔴 Sync connection failed:', error);
      this.setStatus('error');
      this.cleanup();
      throw error;
    }
  }

  /**
   * Disconnect from sync server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from sync server...');
    this.clearReconnectTimer();
    this.cleanup();
    this.setStatus('disconnected');
    this.currentUserId = null;
    this.currentStore = null;
    console.log('✅ Disconnected');
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Subscribe to sync status changes
   * Returns unsubscribe function
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Update status and notify listeners
   */
  private setStatus(status: SyncStatus): void {
    if (this.status !== status) {
      console.log(`🔄 Sync status: ${this.status} → ${status}`);
      this.status = status;
      this.listeners.forEach(cb => cb(status));
    }
  }

  /**
   * Setup auto-reconnect on WebSocket close
   */
  private scheduleReconnect(): void {
    if (!this.ws) return;

    this.ws.onclose = () => {
      // WebSocket closed, schedule reconnect
      this.setStatus('disconnected');
      this.cleanup();

      this.reconnectTimer = setTimeout(() => {
        if (this.currentStore && this.currentUserId) {
          this.connect(this.currentStore, this.currentUserId).catch(() => {
            // Silently fail, user can manually retry via sync button
          });
        }
      }, 5000); // Longer delay for less noise
    };
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clean up WebSocket and synchronizer
   */
  private cleanup(): void {
    if (this.synchronizer) {
      try {
        this.synchronizer.destroy();
      } catch (error) {
        console.error('Error destroying synchronizer:', error);
      }
      this.synchronizer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.ws = null;
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager();
