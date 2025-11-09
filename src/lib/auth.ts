/**
 * Authentication module
 *
 * Handles:
 * - Passphrase generation (BIP39 12-word mnemonics)
 * - User ID derivation (SHA-256 hash of seed)
 * - Session management (login/logout)
 * - Session persistence (restore from storage)
 */

import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { storage } from './storage';

export type AuthState = {
  userId: string;
  passphrase: string;
  isAuthenticated: boolean;
};

class Auth {
  private currentUserId: string | null = null;
  private currentPassphrase: string | null = null;

  /**
   * Derive a deterministic user ID from passphrase
   * Same passphrase always produces same user ID
   */
  async deriveUserId(passphrase: string): Promise<string> {
    if (!passphrase) {
      throw new Error('Cannot derive user ID from empty passphrase');
    }

    try {
      // Convert mnemonic to seed
      const seed = await mnemonicToSeed(passphrase);

      // Hash the seed to create user ID
      const hashBuffer = await crypto.subtle.digest('SHA-256', seed as BufferSource);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Use first 16 chars as user ID
      const userId = hashHex.substring(0, 16);

      console.log('🔑 Derived user ID:', userId);
      return userId;
    } catch (error) {
      console.error('🔴 User ID derivation error:', error);
      throw error;
    }
  }

  /**
   * Generate a new 12-word BIP39 passphrase
   */
  generatePassphrase(): string {
    try {
      const mnemonic = generateMnemonic(wordlist, 128); // 128 bits = 12 words
      console.log('🎲 Generated passphrase:', mnemonic);

      if (!mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }

      // Validate it has 12 words
      const words = mnemonic.split(' ');
      if (words.length !== 12) {
        throw new Error(`Generated mnemonic has ${words.length} words, expected 12`);
      }

      return mnemonic;
    } catch (error) {
      console.error('🔴 Passphrase generation error:', error);
      throw error;
    }
  }

  /**
   * Set current user from passphrase
   * Stores credentials in storage for session persistence
   */
  async setUser(passphrase: string): Promise<string> {
    if (!passphrase || typeof passphrase !== 'string') {
      throw new Error('Invalid passphrase: must be a non-empty string');
    }

    const trimmed = passphrase.trim();
    if (!trimmed) {
      throw new Error('Invalid passphrase: cannot be empty');
    }

    console.log('🔐 Setting user with passphrase...');
    console.log('🔐 Passphrase word count:', trimmed.split(/\s+/).length);

    const userId = await this.deriveUserId(trimmed);

    this.currentUserId = userId;
    this.currentPassphrase = trimmed;

    // Persist to storage
    storage.set('bucket-userId', userId);
    storage.set('bucket-passphrase', trimmed);

    console.log('🔐 User set:', userId);
    return userId;
  }

  /**
   * Get current authenticated user
   * Falls back to storage if in-memory state is empty
   */
  getCurrentUser(): AuthState {
    const userId = this.currentUserId || storage.get('bucket-userId') || '';
    const passphrase = this.currentPassphrase || storage.get('bucket-passphrase') || '';

    return {
      userId,
      passphrase,
      isAuthenticated: !!(userId && passphrase),
    };
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.currentUserId || storage.get('bucket-userId');
  }

  /**
   * Get current passphrase
   */
  getPassphrase(): string | null {
    return this.currentPassphrase || storage.get('bucket-passphrase');
  }

  /**
   * Logout current user
   * Clears in-memory state and storage
   */
  logout(): void {
    console.log('🔐 Logging out...');

    this.currentUserId = null;
    this.currentPassphrase = null;

    storage.remove('bucket-userId');
    storage.remove('bucket-passphrase');

    console.log('🔐 Logged out');
  }

  /**
   * Restore session from storage
   * Call on app startup to restore previous session
   */
  async restoreSession(): Promise<boolean> {
    const userId = storage.get('bucket-userId');
    const passphrase = storage.get('bucket-passphrase');

    if (!userId || !passphrase) {
      return false;
    }

    console.log('🔐 Restoring user session...');

    this.currentUserId = userId;
    this.currentPassphrase = passphrase;

    console.log('🔐 Session restored:', userId);
    return true;
  }

  /**
   * Check if user exists (has valid userId)
   */
  isAuthenticated(): boolean {
    return !!(this.currentUserId || storage.get('bucket-userId'));
  }
}

// Singleton instance
export const auth = new Auth();
