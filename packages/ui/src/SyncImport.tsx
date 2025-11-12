import { useState } from "react";
import { Button } from "./components/ui/button";
import { Download, Upload, X, Check } from "lucide-react";
import { useAuth } from "@bucket/core";

export function SyncImport() {
  const { authenticate } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const [importPassphrase, setImportPassphrase] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!importPassphrase.trim()) {
      setError("Please enter a passphrase");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      await authenticate(importPassphrase.trim());
      setShowImport(false);
      setImportPassphrase("");
    } catch (err) {
      console.error("Import failed:", err);
      setError("Failed to import - check your passphrase");
      setIsImporting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportPassphrase(text);
      setError("");
    } catch (err) {
      console.error("Paste failed:", err);
      setError("Clipboard access denied");
    }
  };

  if (!showImport) {
    return (
      <Button
        onClick={() => setShowImport(true)}
        variant="outline"
        size="lg"
        className="w-full border-blue-600 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500 transition-all"
      >
        <Download className="mr-2 h-5 w-5" />
        Import from Another Device
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/80 p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Import Your Data</h3>
        <Button
          onClick={() => {
            setShowImport(false);
            setImportPassphrase("");
            setError("");
          }}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-400">
        Enter your sync passphrase from another device to import all your lists and tasks
      </p>

      {error && (
        <div className="rounded-lg border border-red-600/50 bg-red-900/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Sync Passphrase
        </label>
        <textarea
          autoFocus
          value={importPassphrase}
          onChange={(e) => setImportPassphrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleImport();
            if (e.key === "Escape") setShowImport(false);
          }}
          placeholder="Paste your 12-word passphrase here..."
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handlePaste}
          variant="outline"
          className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Paste
        </Button>
        <Button
          onClick={handleImport}
          disabled={!importPassphrase.trim() || isImporting}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Importing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Import
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your lists and tasks will sync automatically
      </p>
    </div>
  );
}
