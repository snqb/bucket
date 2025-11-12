import {
  TinyBaseProvider,
  Screen,
  CommandPalette,
  KeyboardHints,
  useKeyboardShortcuts,
  type Command,
} from "@bucket/ui";
import { useAuth, generatePassphrase, useLists, createList } from "@bucket/core";
import { useEffect, useState } from "react";
import { Button } from "@bucket/ui";
import { Plus, ArrowLeft, Copy, Check, Download, Upload, X } from "lucide-react";

function App() {
  const { isAuthenticated, isLoading, authenticate } = useAuth();
  const [isAutoAuthenticating, setIsAutoAuthenticating] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [showSync, setShowSync] = useState(false);
  const [syncPassphrase, setSyncPassphrase] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  const lists = useLists();
  const selectedList = lists.find((l) => l.id === selectedListId);

  const currentPassphrase = localStorage.getItem('bucket-passphrase') || '';

  // Auto-authenticate on first visit
  useEffect(() => {
    const autoAuth = async () => {
      if (!isLoading && !isAuthenticated && !isAutoAuthenticating) {
        setIsAutoAuthenticating(true);
        try {
          const tempPassphrase = generatePassphrase();
          await authenticate(tempPassphrase);
        } catch (error) {
          console.error("Auto-auth failed:", error);
          setIsAutoAuthenticating(false);
        }
      }
    };
    autoAuth();
  }, [isLoading, isAuthenticated, isAutoAuthenticating, authenticate]);

  const handleCreateList = () => {
    if (newListTitle.trim()) {
      const newList = createList(newListTitle.trim(), "📝");
      setNewListTitle("");
      setIsCreating(false);
      setSelectedListId(newList.id);
    }
  };

  const handleCopyPassphrase = () => {
    navigator.clipboard.writeText(currentPassphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncPassphrase = async () => {
    if (syncPassphrase.trim()) {
      try {
        await authenticate(syncPassphrase.trim());
        setShowSync(false);
        setSyncPassphrase("");
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }
  };

  // Define commands for command palette
  const commands: Command[] = [
    {
      id: "new-list",
      label: "Create New List",
      description: "Add a new list to your bucket",
      icon: "📝",
      shortcut: "N",
      action: () => setIsCreating(true),
      category: "Actions",
    },
    {
      id: "toggle-sync",
      label: "Toggle Sync Panel",
      description: "Show/hide sync with other devices",
      icon: "🔄",
      shortcut: "S",
      action: () => setShowSync(!showSync),
      category: "Actions",
    },
    {
      id: "back-to-lists",
      label: "Back to Lists",
      description: "Return to list picker",
      icon: "←",
      shortcut: "Esc",
      action: () => setSelectedListId(null),
      category: "Navigation",
    },
    {
      id: "keyboard-shortcuts",
      label: "Show Keyboard Shortcuts",
      description: "View all available shortcuts",
      icon: "⌨️",
      shortcut: "?",
      action: () => setShowKeyboardHints(true),
      category: "Help",
    },
  ];

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: "k",
        meta: true,
        handler: () => setShowCommandPalette(true),
        description: "Open command palette",
      },
      {
        key: "?",
        shift: true,
        handler: () => setShowKeyboardHints(!showKeyboardHints),
        description: "Toggle keyboard shortcuts",
      },
      {
        key: "n",
        handler: () => setIsCreating(true),
        description: "Create new list",
      },
      {
        key: "s",
        handler: () => setShowSync(!showSync),
        description: "Toggle sync panel",
      },
      {
        key: "Escape",
        handler: () => {
          if (selectedListId) {
            setSelectedListId(null);
          } else {
            setShowCommandPalette(false);
            setShowKeyboardHints(false);
            setShowSync(false);
            setIsCreating(false);
          }
        },
        description: "Close dialogs or go back",
      },
    ],
    true
  );

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

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-sm text-gray-400">Not authenticated</div>
      </div>
    );
  }

  // Show screen picker
  if (!selectedListId || !selectedList) {
    return (
      <div className="flex h-screen w-full flex-col bg-gradient-to-br from-gray-950 to-black p-6">
        {/* Command Palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          commands={commands}
        />

        {/* Keyboard Hints */}
        <KeyboardHints
          isOpen={showKeyboardHints}
          onClose={() => setShowKeyboardHints(false)}
        />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Bucket</h1>
            <p className="text-sm text-gray-400">Your quick-access todo lists</p>
          </div>
          <button
            onClick={() => setShowKeyboardHints(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-900/50 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-gray-800 transition-all text-xs"
            title="Keyboard shortcuts (press ?)"
          >
            <span className="text-sm">⌨️</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">?</kbd>
          </button>
        </div>

        {/* Sync Section */}
        {!showSync ? (
          <div className="mb-6">
            <Button
              onClick={() => setShowSync(true)}
              variant="outline"
              size="sm"
              className="w-full border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Sync with another device
            </Button>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-gray-700 bg-gray-900/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Sync Settings</h3>
              <Button
                onClick={() => setShowSync(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Export passphrase */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Share this key with your other devices
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={currentPassphrase}
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-white font-mono"
                />
                <Button
                  onClick={handleCopyPassphrase}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-gray-500">or</span>
              </div>
            </div>

            {/* Import passphrase */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-300">
                Import data from another device
              </label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={syncPassphrase}
                  onChange={(e) => setSyncPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSyncPassphrase()}
                  placeholder="Paste your sync key here..."
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  onClick={handleSyncPassphrase}
                  size="sm"
                  disabled={!syncPassphrase.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Your lists and todos will sync automatically
              </p>
            </div>
          </div>
        )}

        {/* Lists Section */}
        <div className="flex-1 overflow-auto">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Your Lists
          </h2>
          <div className="flex flex-col gap-2">
            {lists.length === 0 && !isCreating && (
              <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center">
                <p className="text-sm text-gray-400 mb-3">No lists yet</p>
                <Button
                  onClick={() => setIsCreating(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create your first list
                </Button>
              </div>
            )}

            {lists.map((list) => (
              <Button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                variant="outline"
                className="h-auto justify-start border-gray-700 bg-gray-900/50 py-3 text-left hover:bg-gray-800 hover:border-gray-600"
              >
                <span className="mr-3 text-2xl">{list.emoji}</span>
                <span className="text-sm font-medium text-white">{list.title}</span>
              </Button>
            ))}

            {isCreating ? (
              <div className="flex gap-2 rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <input
                  autoFocus
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateList();
                    if (e.key === "Escape") setIsCreating(false);
                  }}
                  placeholder="List name..."
                  className="flex-1 rounded border-0 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleCreateList}
                  size="sm"
                  disabled={!newListTitle.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create
                </Button>
                <Button
                  onClick={() => setIsCreating(false)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            ) : lists.length > 0 && (
              <Button
                onClick={() => setIsCreating(true)}
                variant="ghost"
                className="justify-start border border-dashed border-gray-700 bg-transparent py-3 text-gray-400 hover:border-gray-600 hover:bg-gray-900/50 hover:text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                New List
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show selected screen
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-gray-950 to-black">
      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      {/* Keyboard Hints */}
      <KeyboardHints
        isOpen={showKeyboardHints}
        onClose={() => setShowKeyboardHints(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selectedList.emoji}</span>
          <h1 className="text-xl font-semibold text-white">{selectedList.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyboardHints(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-900/50 text-gray-400 hover:text-white hover:border-gray-600 hover:bg-gray-800 transition-all text-xs"
            title="Keyboard shortcuts (press ?)"
          >
            <span className="text-sm">⌨️</span>
            <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">?</kbd>
          </button>
          <Button
            onClick={() => setSelectedListId(null)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Screen list={selectedList} />
      </div>
    </div>
  );
}

function AppWithProvider() {
  return (
    <TinyBaseProvider>
      <App />
    </TinyBaseProvider>
  );
}

export default AppWithProvider;
