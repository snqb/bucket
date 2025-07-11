import { useState } from "react";
import { useAuth } from "./tinybase-hooks";
import { Button } from "./components/ui/button";
import { generateQRData } from "./tinybase-store";
import * as QRCode from "qrcode";

export const UserControls = () => {
  const { user, logout } = useAuth();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

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
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={showPassphraseModal}
          variant="outline"
          className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          title="Show passphrase"
        >
          🔑 Passphrase
        </Button>
        <Button
          onClick={logout}
          variant="outline"
          className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          title="Logout"
        >
          🚪 Logout
        </Button>
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
