import { usePassphraseAuth } from "jazz-react";
import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { wordlist } from "./wordlist";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = usePassphraseAuth({
    wordlist: wordlist,
  });

  // Auto-login with stored passphrase
  useEffect(() => {
    const storedPassphrase = localStorage.getItem("bucket-passphrase");
    if (storedPassphrase && auth.state === "anonymous") {
      setLoginPassphrase(storedPassphrase);
      handleLogInWithPassphrase(storedPassphrase);
    }
  }, [auth.state]);

  const handleLogInWithPassphrase = async (passphrase: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await auth.logIn(passphrase);
      onOpenChange(false);
    } catch (err) {
      // If auto-login fails, clear stored passphrase
      localStorage.removeItem("bucket-passphrase");
      setError("Stored passphrase is invalid. Please sign in again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (auth.state === "signedIn") {
    return null;
  }

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await auth.signUp();
      // Store passphrase locally
      if (auth.passphrase) {
        localStorage.setItem("bucket-passphrase", auth.passphrase);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogIn = async () => {
    if (!loginPassphrase.trim()) {
      setError("Please enter your passphrase");
      return;
    }

    // Store passphrase locally before attempting login
    localStorage.setItem("bucket-passphrase", loginPassphrase);
    await handleLogInWithPassphrase(loginPassphrase);
  };

  return (
    <div className="space-y-6">
      {/* Sign Up Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2 text-sm">New User</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create a new account and get your passphrase
          </p>

          {auth.passphrase && (
            <div className="mb-4 space-y-2">
              <label className="font-medium text-sm">
                Your passphrase (save this safely!)
              </label>
              <Textarea
                readOnly
                value={auth.passphrase}
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-amber-600">
                ⚠️ Save this passphrase! You'll need it to access your data on
                other devices.
              </p>
            </div>
          )}

          <Button
            onClick={handleSignUp}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? "Creating account..."
              : "Create Account & Get Passphrase"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Log In Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2 text-sm">Existing User</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter your passphrase to access your data
          </p>

          <div className="mb-4 space-y-2">
            <label className="font-medium text-sm">Your passphrase</label>
            <Textarea
              value={loginPassphrase}
              onChange={(e) => setLoginPassphrase(e.target.value)}
              placeholder="Enter your passphrase here..."
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleLogIn}
            disabled={isLoading || !loginPassphrase.trim()}
            variant="outline"
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Sign In with Passphrase"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
