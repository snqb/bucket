import { useState } from "react";
import { useSync, useAuth } from "./tinybase-hooks";
import { Button } from "./components/ui/button";
import { generateQRData } from "./tinybase-store";
import * as QRCode from "qrcode";

export const SyncStatus = () => {
  const {
    syncStatus,
    error,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    hasUser,
  } = useSync();
  const { user, logout } = useAuth();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const getStatusColor = () => {
    switch (syncStatus) {
      case "connected":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case "connected":
        return "🔄";
      case "connecting":
        return "⏳";
      default:
        return "📱";
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case "connected":
        return "Synced";
      case "connecting":
        return "Connecting...";
      default:
        return "Local only";
    }
  };

  const showPassphraseModal = async () => {
    if (!user.passphrase) return;

    try {
      const qrData = generateQRData(user.passphrase);
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrDataUrl(qrUrl);
      setShowPassphrase(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <span className={`${getStatusColor()}`}>
          {getStatusIcon()} {getStatusText()}
        </span>

        {hasUser && !isConnected && !isConnecting && (
          <button
            onClick={connect}
            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200"
          >
            Connect
          </button>
        )}

        {!hasUser && (
          <span className="text-xs text-yellow-600">⚠️ No user</span>
        )}

        {isConnected && (
          <button
            onClick={disconnect}
            className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-200"
          >
            Disconnect
          </button>
        )}

        {error && (
          <span className="text-xs text-red-600" title={error}>
            ❌
          </span>
        )}

        {user.userId && (
          <div className="flex gap-1">
            <button
              onClick={showPassphraseModal}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
              title="Show passphrase"
            >
              🔑
            </button>
            <button
              onClick={logout}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
              title="Logout"
            >
              🚪
            </button>
          </div>
        )}
      </div>

      {/* Passphrase Modal */}
      {showPassphrase && user.passphrase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 bg-opacity-95 p-6">
            <div className="mb-4 text-center">
              <h2 className="font-bold text-xl text-white">Your Passphrase</h2>
              <p className="text-sm text-gray-300">
                Save this securely to access your space
              </p>
            </div>

            <div className="mb-4 text-center">
              <div className="mb-4 inline-block rounded-lg bg-white p-4">
                <img src={qrDataUrl} alt="QR Code" className="h-32 w-32" />
              </div>
              <div className="text-sm text-gray-300">
                <p className="mb-2">Your passphrase:</p>
                <div className="break-all rounded border border-gray-600 bg-gray-800 p-3 font-mono text-xs">
                  {user.passphrase}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(user.passphrase)}
                variant="outline"
                className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
              >
                📋 Copy Words
              </Button>
              <Button
                onClick={() => copyToClipboard(generateQRData(user.passphrase))}
                variant="outline"
                className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
              >
                📋 Copy QR
              </Button>
            </div>

            <Button
              onClick={() => setShowPassphrase(false)}
              className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
