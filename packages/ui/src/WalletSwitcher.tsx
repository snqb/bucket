import { useState } from 'react';
import { Wallet as WalletIcon, Plus, Check, Trash2 } from 'lucide-react';
import { Button } from './components/ui/button';
import type { Wallet } from '@bucket/core';

interface WalletSwitcherProps {
  wallets: Wallet[];
  activeWalletId: string | null;
  onSwitchWallet: (walletId: string) => void;
  onAddWallet: () => void;
  onRemoveWallet?: (walletId: string) => void;
  compact?: boolean; // For top bar usage
}

export function WalletSwitcher({
  wallets,
  activeWalletId,
  onSwitchWallet,
  onAddWallet,
  onRemoveWallet,
  compact = false,
}: WalletSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeWallet = wallets.find((w) => w.userId === activeWalletId);

  if (compact) {
    // Compact mode for top bar
    // If no wallets exist, show simple "Create Wallet" button
    if (wallets.length === 0) {
      return (
        <Button
          onClick={onAddWallet}
          variant="outline"
          size="sm"
          className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          title="Create wallet"
        >
          <WalletIcon className="mr-2 h-4 w-4" />
          Create Wallet
        </Button>
      );
    }

    // If wallets exist, show dropdown switcher
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          aria-label="Switch wallet"
          title={activeWallet?.label || 'Switch wallet'}
        >
          <WalletIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute right-0 top-10 z-20 w-64 rounded-lg border border-gray-600 bg-gray-800 shadow-lg">
              <div className="border-b border-gray-700 p-3">
                <p className="text-xs font-medium text-gray-400">
                  Active Wallet
                </p>
                <p className="text-sm text-white truncate">
                  {activeWallet?.label || 'My Wallet'}
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.userId}
                    onClick={() => {
                      onSwitchWallet(wallet.userId);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded p-2 text-left transition-colors ${
                      wallet.userId === activeWalletId
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex-1 truncate text-sm">
                      {wallet.label || 'My Wallet'}
                    </span>
                    {wallet.userId === activeWalletId && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-700 p-2">
                <Button
                  onClick={() => {
                    onAddWallet();
                    setIsOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Wallet
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode for passphrase screen
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Your Wallets</h3>
        <span className="text-xs text-gray-500">
          {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {wallets.map((wallet) => (
          <div
            key={wallet.userId}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              wallet.userId === activeWalletId
                ? 'border-blue-600 bg-blue-600/10'
                : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
            }`}
          >
            <button
              onClick={() => onSwitchWallet(wallet.userId)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  wallet.userId === activeWalletId
                    ? 'bg-blue-600'
                    : 'bg-gray-700'
                }`}
              >
                <WalletIcon className="h-5 w-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`truncate font-medium ${
                    wallet.userId === activeWalletId
                      ? 'text-blue-400'
                      : 'text-gray-200'
                  }`}
                >
                  {wallet.label || 'My Wallet'}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {wallet.userId}
                </p>
              </div>

              {wallet.userId === activeWalletId && (
                <Check className="h-5 w-5 text-blue-400" />
              )}
            </button>

            {onRemoveWallet && wallets.length > 1 && (
              <button
                onClick={() => onRemoveWallet(wallet.userId)}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded hover:bg-red-600/20 text-gray-500 hover:text-red-400 transition-colors"
                aria-label="Remove wallet"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={onAddWallet}
        variant="outline"
        className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Wallet
      </Button>
    </div>
  );
}
