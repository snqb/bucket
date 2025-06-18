import React, { ReactNode, useEffect, useState } from "react";
import {
  JazzProvider as JazzReactProvider,
  useIsAuthenticated,
  useAccount,
} from "jazz-react";
import { AuthModal } from "./AuthModal";
import { Account, AccountRoot, initializeAccountRoot } from "./jazz-schemas";
import { Button } from "./components/ui/button";

interface JazzProviderProps {
  children: ReactNode;
}

function AuthenticatedApp({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { me, logOut } = useAccount(Account);

  console.log("🔧 JazzProvider account state:", {
    isAuthenticated,
    hasMe: !!me,
    meId: me?.id,
    hasRoot: !!me?.root,
    rootContent: me?.root
      ? {
          todoListsCount: me.root.todoLists?.length || 0,
          todoItemsCount: me.root.todoItems?.length || 0,
          cemeteryCount: me.root.cemetery?.length || 0,
        }
      : null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
      // Store authentication state locally
      localStorage.setItem("bucket-authenticated", "true");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (me && !me.root) {
      // Initialize account root if it doesn't exist
      me.root = initializeAccountRoot();
    }
  }, [me]);

  const handleLogout = () => {
    localStorage.removeItem("bucket-authenticated");
    localStorage.removeItem("bucket-passphrase");
    logOut();
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="space-y-4 text-center">
            <h1 className="font-bold text-2xl">Welcome to Bucket</h1>
            <p className="text-muted-foreground">
              Sign in to access your todo lists
            </p>
          </div>
        </div>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  return (
    <>
      {children}
      <Button
        onClick={handleLogout}
        className="fixed right-4 top-4 bg-red-600 text-white hover:bg-red-700"
        size="sm"
      >
        Logout
      </Button>
    </>
  );
}

export function JazzProvider({ children }: JazzProviderProps) {
  return (
    <JazzReactProvider
      sync={{
        peer: "ws://127.0.0.1:4200",
        when: "always",
      }}
      // guestMode={false}
      storage={"indexedDB"}
      defaultProfileName="New User"
      AccountSchema={Account}
    >
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </JazzReactProvider>
  );
}
