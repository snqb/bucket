import React, { useState, useEffect } from "react";
import { useAuth } from "@bucket/core";
import { walletManager, type Wallet } from "@bucket/core";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader
} from "./components/ui/dialog";
import { Copy, Eye, EyeOff, Plus, Wallet as WalletIcon, Download, Upload } from "lucide-react";

interface WalletManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ open, onOpenChange }) => {
  const { logout } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [currentPassphrase, setCurrentPassphrase] = useState<string>("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [copiedPassphrase, setCopiedPassphrase] = useState(false);
  const [importPassphrase, setImportPassphrase] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSection, setShowImportSection] = useState(false);

  // Load wallets and current passphrase
  useEffect(() => {
    if (open) {
      const allWallets = walletManager.getAllWallets();
      setWallets(allWallets);
      setActiveWalletId(walletManager.getActiveWalletId());

      // Get current passphrase from localStorage
      const storedPassphrase = localStorage.getItem("bucket-passphrase");
      if (storedPassphrase) {
        setCurrentPassphrase(storedPassphrase);
      }
    }
  }, [open]);

  const handleCopyPassphrase = async () => {
    try {
      await navigator.clipboard.writeText(currentPassphrase);
      setCopiedPassphrase(true);
      setTimeout(() => setCopiedPassphrase(false), 2000);
    } catch (error) {
      console.error("Failed to copy passphrase:", error);
    }
  };

  const handleImportPassphrase = () => {
    setShowImportSection(!showImportSection);
  };

  const handleImportSubmit = async () => {
    if (!importPassphrase.trim()) {
      alert("Please enter a passphrase to import");
      return;
    }

    setIsImporting(true);

    try {
      const trimmedPassphrase = importPassphrase.trim();

      // Basic validation
      const words = trimmedPassphrase.split(/\s+/);
      if (
        words.length !== 12 &&
        words.length !== 15 &&
        words.length !== 18 &&
        words.length !== 21 &&
        words.length !== 24
      ) {
        alert("Passphrase must be 12, 15, 18, 21, or 24 words");
        setIsImporting(false);
        return;
      }

      // Add the imported wallet to wallet manager
      const userId = await walletManager.addWallet(trimmedPassphrase, 'Imported Wallet');
      if (!userId) {
        alert("Failed to import wallet");
        setIsImporting(false);
        return;
      }

      // Update wallets list
      const updatedWallets = walletManager.getAllWallets();
      setWallets(updatedWallets);

      // Switch to the imported wallet
      setActiveWalletId(userId);
      setCurrentPassphrase(trimmedPassphrase);

      // Clear import form
      setImportPassphrase("");
      setShowImportSection(false);

      alert("✅ Wallet imported successfully!");
    } catch (err) {
      console.error("Import wallet error:", err);
      alert("Failed to import wallet. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportPassphrase = () => {
    try {
      // Create a text file with the passphrase
      const blob = new Blob([currentPassphrase], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bucket-wallet-passphrase-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export passphrase:", error);
    }
  };

  
  const handleCreateNewWallet = () => {
    onOpenChange(false);
    logout();
  };

  const handleSwitchWallet = async (walletId: string) => {
    try {
      await walletManager.switchToWallet(walletId);
      setActiveWalletId(walletId);
      onOpenChange(false);
      // Reload to refresh with new wallet data
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch wallet:", error);
    }
  };

  const getPassphrasePreview = (passphrase: string) => {
    const words = passphrase.split(" ");
    if (words.length <= 4) return passphrase;
    return `${words.slice(0, 2).join(" ")} ... ${words.slice(-2).join(" ")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            Your Wallets
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your wallets and view your recovery passphrase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Wallet & Passphrase */}
          {currentPassphrase && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Your Recovery Passphrase</h3>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={handleExportPassphrase}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Export passphrase to file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                  >
                    {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-gray-900 rounded p-3 font-mono text-sm border border-gray-700">
                {showPassphrase ? currentPassphrase : getPassphrasePreview(currentPassphrase)}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyPassphrase}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedPassphrase ? "Copied!" : "Copy"}
                </Button>
                <Button
                  onClick={handleImportPassphrase}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                🔒 Save this phrase securely. It's the only way to restore your wallet.
              </p>
            </div>
          )}

          {/* Import Section */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Import Existing Wallet</h3>
              <Button
                onClick={handleImportPassphrase}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                {showImportSection ? "Hide" : "Show"}
              </Button>
            </div>

            {showImportSection && (
              <div className="space-y-3">
                <div>
                  <label className="font-medium mb-2 block text-sm text-gray-300">
                    Recovery Passphrase
                  </label>
                  <textarea
                    value={importPassphrase}
                    onChange={(e) => setImportPassphrase(e.target.value)}
                    placeholder="Enter your 12-word passphrase..."
                    className="w-full rounded border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setImportPassphrase("");
                      setShowImportSection(false);
                    }}
                    variant="outline"
                    className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleImportSubmit}
                    disabled={!importPassphrase.trim() || isImporting}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    {isImporting ? (
                      <>Importing...</>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Wallet
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  <p>💡 Make sure you have exactly 12 words separated by spaces</p>
                  <p>🔒 Your passphrase is never sent to any server</p>
                </div>
              </div>
            )}
          </div>

          {/* Wallets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">All Wallets ({wallets.length})</h3>
              <Button
                onClick={handleCreateNewWallet}
                size="sm"
                className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Wallet
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {wallets.map((wallet) => (
                <div
                  key={wallet.userId}
                  onClick={() => handleSwitchWallet(wallet.userId)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${wallet.userId === activeWalletId
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {wallet.label || `Wallet ${wallets.indexOf(wallet) + 1}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {wallet.userId.slice(0, 8)}...{wallet.userId.slice(-8)}
                      </div>
                    </div>
                    {wallet.userId === activeWalletId && (
                      <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Active
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {wallets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <WalletIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No wallets created yet</p>
                  <p className="text-sm mt-1">Create your first wallet to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-700">
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Logout
            </Button>

            <div className="text-xs text-gray-500">
              📱 Your data is stored locally and synced when online
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};