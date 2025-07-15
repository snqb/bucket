import { useState } from "react";
import { useSync } from "./tinybase-hooks";
import { Button } from "./components/ui/button";

export function SyncButton() {
  const {
    syncStatus,
    error,
    syncNow,
    isConnecting,
    lastSync,
    autoSync,
    setAutoSync,
  } = useSync();

  const [showMenu, setShowMenu] = useState(false);

  const getStatusIcon = () => {
    if (isConnecting) return "⏳";
    if (syncStatus === "connected") return "✅";
    return "🔄";
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
        className="flex items-center gap-2"
      >
        <span>{getStatusIcon()}</span>
        <span className="text-xs">Sync</span>
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md bg-gray-900 p-2 shadow-lg border border-gray-800 z-50">
          <div className="text-xs text-gray-400 mb-2">
            Last sync: {getLastSyncText()}
          </div>

          {error && (
            <div className="text-xs text-red-400 mb-2">{error}</div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={syncNow}
            disabled={isConnecting}
            className="w-full justify-start mb-1"
          >
            {isConnecting ? "Syncing..." : "Sync Now"}
          </Button>

          <label className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-800 rounded">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4"
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
