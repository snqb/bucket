import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  generatePassphrase,
  setUser,
  getCurrentUser,
  generateQRData,
  parseQRData,
} from "./tinybase-store";
import * as QRCode from "qrcode";

interface UserAuthProps {
  onAuthenticated: (userId: string) => void;
}

export const UserAuth = ({ onAuthenticated }: UserAuthProps) => {
  const [passphrase, setPassphrase] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const handleCreateNew = async () => {
    setIsCreating(true);
    setError("");

    try {
      const newPassphrase = generatePassphrase();
      setPassphrase(newPassphrase);

      // Generate QR code
      const qrData = generateQRData(newPassphrase);
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrDataUrl(qrUrl);
      setShowQR(true);
    } catch (err) {
      setError("Failed to create passphrase");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUsePassphrase = async () => {
    if (!passphrase.trim()) {
      setError("Please enter a passphrase");
      return;
    }

    try {
      const userId = await setUser(passphrase.trim());
      onAuthenticated(userId);
    } catch (err) {
      setError("Invalid passphrase");
      console.error(err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseQRData(text);
      if (parsed) {
        setPassphrase(parsed);
      } else {
        setPassphrase(text);
      }
    } catch (err) {
      setError("Failed to read from clipboard");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(passphrase);
      // Could add a toast notification here
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  const copyQRDataToClipboard = async () => {
    try {
      const qrData = generateQRData(passphrase);
      await navigator.clipboard.writeText(qrData);
      // Could add a toast notification here
    } catch (err) {
      setError("Failed to copy QR data to clipboard");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 bg-opacity-50 p-8">
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">🔐</div>
          <h1 className="font-bold mb-2 text-2xl text-white">
            Enter Your Space
          </h1>
          <p className="text-sm text-gray-300">
            Use your passphrase to access your private lists
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-500 bg-red-900 bg-opacity-50 px-4 py-2 text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!showQR ? (
            <>
              <div>
                <label className="font-medium mb-2 block text-sm text-gray-300">
                  Passphrase
                </label>
                <textarea
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter your 12-word passphrase..."
                  className="w-full rounded border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePasteFromClipboard}
                  variant="outline"
                  className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  📋 Paste
                </Button>
                <Button
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isCreating ? "⏳ Creating..." : "🎲 Create New"}
                </Button>
              </div>

              <Button
                onClick={handleUsePassphrase}
                disabled={!passphrase.trim()}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                🚀 Enter Space
              </Button>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="inline-block rounded-lg bg-white p-4">
                <img src={qrDataUrl} alt="QR Code" className="h-48 w-48" />
              </div>

              <div className="text-sm text-gray-300">
                <p className="mb-2">Your passphrase:</p>
                <div className="break-all rounded border border-gray-600 bg-gray-800 p-3 font-mono text-xs">
                  {passphrase}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  📋 Copy Words
                </Button>
                <Button
                  onClick={copyQRDataToClipboard}
                  variant="outline"
                  className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  📋 Copy QR
                </Button>
              </div>

              <div className="space-y-1 text-xs text-gray-400">
                <p>💾 Save this passphrase securely</p>
                <p>🔄 Share QR code for easy access</p>
                <p>⚠️ Without it, you'll lose access to your lists</p>
              </div>

              <Button
                onClick={handleUsePassphrase}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                🚀 Enter Space
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>🔒 Your data is encrypted and private</p>
          <p>🌐 Works across all your devices</p>
        </div>
      </div>
    </div>
  );
};
