import { useState } from "react";
import { Button } from "./components/ui/button";
import { Loader2 } from "lucide-react";
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSkipAuth = async () => {
    setIsSkipping(true);
    setError("");

    try {
      // Create a temporary anonymous passphrase
      const tempPassphrase = generatePassphrase();
      const userId = await setUser(tempPassphrase);
      if (!userId) {
        setError("Failed to create temporary session");
        setIsSkipping(false);
        return;
      }
      onAuthenticated(userId);
    } catch (err) {
      console.error("Skip auth error:", err);
      setError("Failed to create temporary session");
      setIsSkipping(false);
    }
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    setError("");

    try {
      const newPassphrase = generatePassphrase();

      if (!newPassphrase) {
        setError("Failed to generate passphrase - please try again");
        setIsCreating(false);
        return;
      }

      // Validate the generated passphrase
      const words = newPassphrase.split(" ");
      if (words.length !== 12) {
        setError(
          `Invalid passphrase generated: ${words.length} words instead of 12`,
        );
        setIsCreating(false);
        return;
      }

      setPassphrase(newPassphrase);
      setError(""); // Clear any previous errors

      // Generate QR code
      const qrData = generateQRData(newPassphrase);
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrDataUrl(qrUrl);
      setShowQR(true);
    } catch (err) {
      console.error("Create passphrase error:", err);
      if (err instanceof Error) {
        if (err.message.includes("crypto")) {
          setError(
            "Browser crypto API not available - please use a modern browser",
          );
        } else if (err.message.includes("QR")) {
          setError("Failed to generate QR code - passphrase still valid");
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError("Unexpected error creating passphrase");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUsePassphrase = async () => {
    if (!passphrase.trim()) {
      setError("Please enter a passphrase");
      return;
    }

    setIsAuthenticating(true);
    setError("");

    try {
      const trimmedPassphrase = passphrase.trim();

      // Basic validation
      if (!trimmedPassphrase) {
        setError("Please enter a passphrase");
        setIsAuthenticating(false);
        return;
      }

      // For BIP39, validate it has 12 words (or allow other valid lengths)
      const words = trimmedPassphrase.split(/\s+/);
      if (
        words.length !== 12 &&
        words.length !== 15 &&
        words.length !== 18 &&
        words.length !== 21 &&
        words.length !== 24
      ) {
        setError("Passphrase must be 12, 15, 18, 21, or 24 words");
        setIsAuthenticating(false);
        return;
      }

      const userId = await setUser(trimmedPassphrase);
      if (!userId) {
        setError("Failed to create user");
        setIsAuthenticating(false);
        return;
      }

      onAuthenticated(userId);
    } catch (err) {
      console.error("Auth error:", err);
      if (err instanceof Error) {
        if (err.message.includes("crypto")) {
          setError(
            "Browser crypto API not available - please use a modern browser",
          );
        } else if (err.message.includes("localStorage")) {
          setError("Unable to save data - please check browser settings");
        } else if (err.message.includes("Invalid passphrase")) {
          setError("Invalid passphrase format - please check and try again");
        } else {
          setError(`Authentication failed: ${err.message}`);
        }
      } else {
        setError("Unexpected authentication error");
      }
      setIsAuthenticating(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setError("Clipboard is empty");
        return;
      }

      const parsed = parseQRData(text);
      if (parsed) {
        setPassphrase(parsed);
        setError(""); // Clear error on success
      } else {
        setPassphrase(text);
        setError(""); // Clear error on success
      }
    } catch (err) {
      console.error("Clipboard error:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Clipboard access denied - please allow permissions");
      } else {
        setError("Unable to read from clipboard - try pasting manually");
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      if (!passphrase) {
        setError("No passphrase to copy");
        return;
      }
      await navigator.clipboard.writeText(passphrase);
      // Show success feedback
      const prevError = error;
      setError("✅ Copied to clipboard!");
      setTimeout(() => {
        if (error === "✅ Copied to clipboard!") {
          setError(prevError || "");
        }
      }, 2000);
    } catch (err) {
      console.error("Copy error:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Clipboard access denied - please allow permissions");
      } else {
        setError("Unable to copy - try selecting and copying manually");
      }
    }
  };

  const copyQRDataToClipboard = async () => {
    try {
      if (!passphrase) {
        setError("No passphrase to copy");
        return;
      }
      const qrData = generateQRData(passphrase);
      await navigator.clipboard.writeText(qrData);
      // Show success feedback
      const prevError = error;
      setError("✅ QR data copied!");
      setTimeout(() => {
        if (error === "✅ QR data copied!") {
          setError(prevError || "");
        }
      }, 2000);
    } catch (err) {
      console.error("Copy QR error:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Clipboard access denied - please allow permissions");
      } else {
        setError("Unable to copy QR data");
      }
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
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "🎲 Create New"
                  )}
                </Button>
              </div>

              <Button
                onClick={handleUsePassphrase}
                disabled={!passphrase.trim() || isAuthenticating}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "🚀 Enter Space"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-900 px-2 text-gray-400">or</span>
                </div>
              </div>

              <Button
                onClick={handleSkipAuth}
                disabled={isSkipping}
                variant="outline"
                className="w-full border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800"
              >
                {isSkipping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating session...
                  </>
                ) : (
                  "⚡ Skip for now (anonymous session)"
                )}
              </Button>

              <p className="text-center text-xs text-gray-500">
                Anonymous sessions are temporary and won't sync across devices
              </p>
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
