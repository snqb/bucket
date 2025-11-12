import { useState } from "react";
import { useSync } from "@bucket/core";
import { Button } from "./components/ui/button";
import { Loader2 } from "lucide-react";

export function SyncButton() {
  const {
    syncStatus,
    error,
    syncNow,
    isConnecting,
    isSyncing,
    lastSync,
  } = useSync();

  const [showMenu, setShowMenu] = useState(false);

  const getStatusIcon = () => {
    if (isSyncing || isConnecting) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
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

  const getStatusColor = () => {
    if (syncStatus === "connected") return "text-green-400";
    if (error || syncStatus === "error") return "text-red-400";
    if (isConnecting) return "text-yellow-400";
    return "text-gray-400";
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 border border-gray-600 bg-gray-900/90 backdrop-blur hover:bg-gray-800 ${getStatusColor()}`}
      >
        <span className="flex items-center justify-center font-bold text-sm">
          {getStatusIcon()}
        </span>
        <span className="font-medium text-xs">Sync</span>
      </Button>

      {showMenu && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-800 bg-gray-900 p-2 shadow-lg">
          <div className="mb-2 text-xs text-gray-400">
            Last sync: {getLastSyncText()}
          </div>

          {error && <div className="mb-2 text-xs text-red-400">{error}</div>}

          <Button
            variant="ghost"
            size="sm"
            onClick={syncNow}
            disabled={isConnecting}
            className="w-full justify-start"
          >
            {isConnecting || isSyncing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Syncing...
              </>
            ) : (
              "Sync Now"
            )}
          </Button>
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
