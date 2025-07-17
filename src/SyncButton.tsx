import { useState } from "react";
import { useSync } from "./tinybase-hooks";
import { Button } from "./components/ui/button";

export function SyncButton() {
  const {
    syncStatus,
    error,
    syncNow,
    isConnecting,
    isSyncing,
    lastSync,
    autoSync,
    setAutoSync,
  } = useSync();

  const [showMenu, setShowMenu] = useState(false);

  const getStatusIcon = () => {
    if (isSyncing) return "↻";
    if (isConnecting) return "↻";
    if (syncStatus === "connected") return "●";
    return "○";
  };

  const getLastSyncText = () => {
    if (!lastSync) return "Never synced";

    const seconds = Math.floor((Date.now() - lastSync) / 1000);
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 border border-gray-600 bg-gray-800 hover:bg-gray-700"
      >
        <span className="font-bold text-sm">{getStatusIcon()}</span>
        <span className="font-medium text-xs">Sync</span>
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-800 bg-gray-900 p-2 shadow-lg">
          <div className="mb-2 text-xs text-gray-400">
            Last sync: {getLastSyncText()}
          </div>

          {error && <div className="mb-2 text-xs text-red-400">{error}</div>}

          <Button
            variant="ghost"
            size="sm"
            onClick={syncNow}
            disabled={isConnecting}
            className="mb-1 w-full justify-start"
          >
            {isConnecting || isSyncing ? "Syncing..." : "Sync Now"}
          </Button>

          <label className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm hover:bg-gray-800">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Auto-sync on changes</span>
          </label>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
