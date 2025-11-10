// Desktop app - uses same components as web!
import {
  SyncStatus,
  SyncButton,
  DataRecovery,
  UserAuth,
  UserControls,
  Screen,
  useKeyboardShortcuts,
  AddListDialog,
  Button,
} from "@bucket/ui";

import {
  useLists,
  useCemeteryItems,
  useActions,
  useAuth,
  hasLocalData,
  randomEmoji,
  generatePassphrase,
} from "@bucket/core";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { Trash2, ChevronLeft, ChevronRight, Menu, X, Edit2 } from "lucide-react";

function App() {
  const { isAuthenticated, isLoading, authenticate } = useAuth();
  const [isAutoAuthenticating, setIsAutoAuthenticating] = useState(false);

  // Auto-authenticate on first visit
  useEffect(() => {
    const autoAuth = async () => {
      if (!isLoading && !isAuthenticated && !isAutoAuthenticating) {
        setIsAutoAuthenticating(true);
        try {
          const tempPassphrase = generatePassphrase();
          await authenticate(tempPassphrase);
        } catch (error) {
          console.error('Auto-auth failed:', error);
          setIsAutoAuthenticating(false);
        }
      }
    };
    autoAuth();
  }, [isLoading, isAuthenticated, isAutoAuthenticating, authenticate]);

  if (isLoading || isAutoAuthenticating) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="font-bold mb-4 text-4xl">...</div>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed left-4 top-4 z-50">
        <SyncButton />
      </div>

      <DataRecovery />

      <Switch>
        <Route path="/" component={Bucket} />
        <Route path="/cemetery" component={Cemetery} />
      </Switch>
    </>
  );
}

// Same Bucket component as web app
const Bucket = () => {
  const lists = useLists();
  const actions = useActions();
  const { isLoading } = useAuth();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [editingMobileTitle, setEditingMobileTitle] = useState(false);
  const [mobileTitle, setMobileTitle] = useState("");
  const [showAddListDialog, setShowAddListDialog] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkInitialization = async () => {
      const hasData = hasLocalData();
      const hasStoredUser = !!(
        localStorage.getItem("bucket-userId") &&
        localStorage.getItem("bucket-passphrase")
      );

      if (hasData) {
        setIsInitializing(false);
      } else if (hasStoredUser) {
        const timer = setTimeout(() => {
          setIsInitializing(false);
        }, 2500);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setIsInitializing(false), 500);
        return () => clearTimeout(timer);
      }
    };

    checkInitialization();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      handler: () => setShowAddListDialog(true),
      description: "New list",
    },
    {
      key: "c",
      handler: () => setLocation("/cemetery"),
      description: "Cemetery",
    },
    {
      key: "m",
      handler: () => setShowMap(!showMap),
      description: "Toggle map",
    },
    {
      key: "ArrowLeft",
      handler: () =>
        setCurrentScreenIndex((prev) => (prev > 0 ? prev - 1 : prev)),
      description: "Previous list",
    },
    {
      key: "ArrowRight",
      handler: () =>
        setCurrentScreenIndex((prev) =>
          prev < lists.length - 1 ? prev + 1 : prev
        ),
      description: "Next list",
    },
    {
      key: "Escape",
      handler: () => {
        setShowAddListDialog(false);
        setEditingListId(null);
      },
      description: "Close dialogs",
    },
  ]);

  // Empty state
  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="font-bold mb-4 text-4xl">...</div>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mb-8 text-8xl"
        >
          🪣
        </motion.div>
        <h1 className="font-bold mb-2 text-2xl text-white">Welcome to Bucket</h1>
        <p className="mb-8 text-gray-400">Start by creating your first list</p>
        <Button
          onClick={() => setShowAddListDialog(true)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          + Create List
        </Button>

        <AddListDialog
          isOpen={showAddListDialog}
          onClose={() => setShowAddListDialog(false)}
          onAdd={(title, emoji, color) => {
            actions.addList(title, emoji, color);
            setShowAddListDialog(false);
          }}
        />

        <UserControls className="fixed bottom-4 right-4" />
      </div>
    );
  }

  const currentList = lists[currentScreenIndex];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="fixed right-4 top-4 z-50">
        <UserControls />
      </div>

      {/* Desktop view */}
      <div className="hidden h-full w-full md:block">
        <Screen key={currentList.id} list={currentList} />
      </div>

      {/* Add List Dialog */}
      <AddListDialog
        isOpen={showAddListDialog}
        onClose={() => setShowAddListDialog(false)}
        onAdd={(title, emoji, color) => {
          actions.addList(title, emoji, color);
          setShowAddListDialog(false);
        }}
      />
    </div>
  );
};

const Cemetery = () => {
  const items = useCemeteryItems();
  const actions = useActions();
  const lists = useLists();
  const [, setLocation] = useLocation();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col bg-black p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold mb-2 text-3xl text-white">🪦 Cemetery</h1>
          <p className="text-gray-400">
            {items.length} deleted {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Button
          onClick={() => setLocation("/")}
          variant="outline"
          className="border-gray-600 text-white hover:bg-gray-800"
        >
          ← Back
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">✨</div>
            <p className="text-gray-400">No deleted items</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-700 bg-gray-900 p-4"
            >
              <h3 className="font-medium mb-2 text-white">
                {item.originalTitle}
              </h3>
              {item.originalDescription && (
                <p className="mb-2 text-sm text-gray-400">
                  {item.originalDescription}
                </p>
              )}
              <div className="mb-4 text-sm text-gray-500">
                Progress: {item.originalProgress}%
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setShowRestoreDialog(true);
                  }}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  ↺ Restore
                </Button>
                <Button
                  onClick={() => actions.permanentlyDelete(item.id)}
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900"
                >
                  × Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore dialog */}
      {showRestoreDialog && selectedItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6">
            <h2 className="font-bold mb-4 text-xl text-white">
              Restore to which list?
            </h2>
            <div className="space-y-2">
              {lists.map((list) => (
                <Button
                  key={list.id}
                  onClick={() => {
                    actions.restoreFromCemetery(selectedItemId, list.id);
                    setShowRestoreDialog(false);
                    setSelectedItemId(null);
                  }}
                  variant="outline"
                  className="w-full justify-start border-gray-600 text-white hover:bg-gray-800"
                >
                  {list.emoji} {list.title}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => {
                setShowRestoreDialog(false);
                setSelectedItemId(null);
              }}
              variant="outline"
              className="mt-4 w-full border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
