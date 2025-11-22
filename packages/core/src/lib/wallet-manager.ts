/**
 * Multi-wallet management
 *
 * Handles:
 * - Multiple wallet/passphrase storage
 * - Active wallet switching
 * - Wallet labeling and organization
 * - Merged data access across all wallets
 */

import { storage } from './storage';
import { auth } from './auth';

export interface Wallet {
  userId: string;
  passphrase: string;
  label?: string; // User-defined wallet name (optional)
  createdAt: number;
}

class WalletManager {
  private readonly WALLETS_KEY = 'bucket-wallets';
  private readonly ACTIVE_WALLET_KEY = 'bucket-activeWalletId';

  /**
   * Get all stored wallets
   */
  getAllWallets(): Wallet[] {
    try {
      const walletsJson = storage.get(this.WALLETS_KEY);
      if (!walletsJson) return [];

      const wallets = JSON.parse(walletsJson) as Wallet[];
      return wallets;
    } catch (error) {
      console.error('Failed to load wallets:', error);
      return [];
    }
  }

  /**
   * Get currently active wallet ID
   */
  getActiveWalletId(): string | null {
    return storage.get(this.ACTIVE_WALLET_KEY);
  }

  /**
   * Add a new wallet (from passphrase)
   * Returns the new wallet's userId
   */
  async addWallet(passphrase: string, label?: string): Promise<string> {
    if (!passphrase?.trim()) {
      throw new Error('Passphrase is required');
    }

    const trimmed = passphrase.trim();

    // Derive userId from passphrase
    const userId = await auth.deriveUserId(trimmed);

    // Check if wallet already exists
    const wallets = this.getAllWallets();
    const existing = wallets.find(w => w.userId === userId);

    if (existing) {
      // Wallet already exists, just switch to it
      await this.switchToWallet(userId);
      return userId;
    }

    // Create new wallet
    const newWallet: Wallet = {
      userId,
      passphrase: trimmed,
      label,
      createdAt: Date.now(),
    };

    // Add to wallets list
    const updatedWallets = [...wallets, newWallet];
    storage.set(this.WALLETS_KEY, JSON.stringify(updatedWallets));

    // Switch to new wallet
    await this.switchToWallet(userId);

    return userId;
  }

  /**
   * Switch to a different wallet
   * Updates active wallet and auth state
   */
  async switchToWallet(userId: string): Promise<void> {
    const wallets = this.getAllWallets();
    const wallet = wallets.find(w => w.userId === userId);

    if (!wallet) {
      throw new Error(`Wallet not found: ${userId}`);
    }

    // Update active wallet
    storage.set(this.ACTIVE_WALLET_KEY, userId);

    // Update auth state
    await auth.setUser(wallet.passphrase);
  }

  /**
   * Remove a wallet
   * WARNING: This does NOT delete the wallet's data, only the wallet reference
   */
  removeWallet(userId: string): void {
    const wallets = this.getAllWallets();
    const updated = wallets.filter(w => w.userId !== userId);

    if (updated.length === wallets.length) {
      throw new Error(`Wallet not found: ${userId}`);
    }

    storage.set(this.WALLETS_KEY, JSON.stringify(updated));

    // If we removed the active wallet, switch to first available
    const activeId = this.getActiveWalletId();
    if (activeId === userId && updated.length > 0) {
      storage.set(this.ACTIVE_WALLET_KEY, updated[0].userId);
      // Note: Auth state not updated here - caller must handle
    }
  }

  /**
   * Update wallet label
   */
  updateWalletLabel(userId: string, label: string): void {
    const wallets = this.getAllWallets();
    const wallet = wallets.find(w => w.userId === userId);

    if (!wallet) {
      throw new Error(`Wallet not found: ${userId}`);
    }

    wallet.label = label;
    storage.set(this.WALLETS_KEY, JSON.stringify(wallets));
  }

  /**
   * Get specific wallet by userId
   */
  getWallet(userId: string): Wallet | null {
    const wallets = this.getAllWallets();
    return wallets.find(w => w.userId === userId) || null;
  }

  /**
   * Check if any wallets exist
   */
  hasWallets(): boolean {
    return this.getAllWallets().length > 0;
  }

  /**
   * Migrate existing single-wallet setup to multi-wallet
   * Call this on app startup to migrate old users
   */
  async migrateFromSingleWallet(): Promise<void> {
    // Check if already migrated
    if (this.hasWallets()) {
      return;
    }

    // Check if old single-wallet data exists
    const userId = storage.get('bucket-userId');
    const passphrase = storage.get('bucket-passphrase');

    if (userId && passphrase) {
      // Migrate to multi-wallet format
      const wallet: Wallet = {
        userId,
        passphrase,
        label: 'My Wallet',
        createdAt: Date.now(),
      };

      storage.set(this.WALLETS_KEY, JSON.stringify([wallet]));
      storage.set(this.ACTIVE_WALLET_KEY, userId);

      console.log('✅ Migrated single wallet to multi-wallet format');
    }
  }

  /**
   * Get active wallet
   */
  getActiveWallet(): Wallet | null {
    const activeId = this.getActiveWalletId();
    if (!activeId) return null;

    return this.getWallet(activeId);
  }
}

// Singleton instance
export const walletManager = new WalletManager();
