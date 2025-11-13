// UI Components from @bucket/ui
import {
  SyncStatus,
  SyncImport,
  SyncButton,
  DataRecovery,
  UserAuth,
  UserControls,
  Screen,
  useKeyboardShortcuts,
  AddListDialog,
  Button,
  CommandPalette,
  KeyboardHints,
  type Command,
} from "@bucket/ui";

// Core logic from @bucket/core
import {
  useLists,
  useCemeteryItems,
  useActions,
  useAuth,
  hasLocalData,
  randomEmoji,
} from "@bucket/core";

// External dependencies
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Edit2,
  Plus
} from "lucide-react";

function App() {
  const { isAuthenticated, isLoading, authenticate } = useAuth();
  const [isAutoAuthenticating, setIsAutoAuthenticating] = useState(false);
  const [currentView, setCurrentView] = useState<'bucket' | 'cemetery'>('bucket');

  // Auto-authenticate on first visit
  useEffect(() => {
    const autoAuth = async () => {
      if (!isLoading && !isAuthenticated && !isAutoAuthenticating) {
        setIsAutoAuthenticating(true);
        try {
          // Generate anonymous passphrase and auto-login
          const { generatePassphrase } = await import('@bucket/core');
          const tempPassphrase = generatePassphrase();
          await authenticate(tempPassphrase);
        } catch (error) {
          console.error('Auto-auth failed:', error);
        } finally {
          // Always set to false when done, whether success or failure
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
      <DataRecovery />
      {currentView === 'bucket' ? (
        <Bucket onNavigateToCemetery={() => setCurrentView('cemetery')} />
      ) : (
        <Cemetery onNavigateBack={() => setCurrentView('bucket')} />
      )}
    </>
  );
}

const Bucket = ({ onNavigateToCemetery }: { onNavigateToCemetery: () => void }) => {
  const lists = useLists();
  const actions = useActions();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isWideLayout, setIsWideLayout] = useState(window.innerWidth >= 700);

  // Reset current screen index if it's out of bounds
  useEffect(() => {
    if (lists && lists.length > 0 && currentScreenIndex >= lists.length) {
      setCurrentScreenIndex(0);
    }
  }, [lists, currentScreenIndex]);

  // Auto-detect window size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsWideLayout(window.innerWidth >= 700);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePreviousScreen = () => {
    if (lists && lists.length > 0) {
      setCurrentScreenIndex((prev) => (prev - 1 + lists.length) % lists.length);
    }
  };

  const handleNextScreen = () => {
    if (lists && lists.length > 0) {
      setCurrentScreenIndex((prev) => (prev + 1) % lists.length);
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() && currentScreen) {
      actions.createTask(String(currentScreen.id), newTaskTitle.trim());
      setNewTaskTitle('');
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
      action: () => {
        const name = prompt("List name:");
        if (name) actions.createList(name);
      },
      category: "Actions",
    },
    {
      id: "cemetery",
      label: "Open Cemetery",
      description: "View deleted tasks",
      icon: "🪦",
      shortcut: "C",
      action: () => onNavigateToCemetery(),
      category: "Navigation",
    },
    {
      id: "prev-list",
      label: "Previous List",
      description: "Navigate to previous list",
      icon: "←",
      shortcut: "H or ←",
      action: () => handlePreviousScreen(),
      category: "Navigation",
    },
    {
      id: "next-list",
      label: "Next List",
      description: "Navigate to next list",
      icon: "→",
      shortcut: "L or →",
      action: () => handleNextScreen(),
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
        handler: () => {
          const name = prompt("List name:");
          if (name) actions.createList(name);
        },
        description: "Create new list",
      },
      {
        key: "c",
        handler: () => onNavigateToCemetery(),
        description: "Open cemetery",
      },
      {
        key: "h",
        handler: () => handlePreviousScreen(),
        description: "Previous list",
      },
      {
        key: "l",
        handler: () => handleNextScreen(),
        description: "Next list",
      },
      {
        key: "ArrowLeft",
        handler: () => handlePreviousScreen(),
        description: "Previous list",
      },
      {
        key: "ArrowRight",
        handler: () => handleNextScreen(),
        description: "Next list",
      },
      {
        key: "Escape",
        handler: () => {
          setShowCommandPalette(false);
          setShowKeyboardHints(false);
        },
        description: "Close dialogs",
      },
    ],
    !!lists && lists.length > 0
  );

  const currentScreen = lists?.[currentScreenIndex];

  // Handle case when no lists exist
  if (!lists || lists.length === 0) {

    return (
      <div className="flex h-screen w-screen flex-col bg-black">
        {/* Unified Top Bar - Empty State */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪣</span>
            <span className="font-bold text-white text-lg">Bucket</span>
          </div>
          <div className="flex items-center gap-2">
            <SyncButton />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md text-center px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="font-bold mb-6 text-8xl">🪣</div>
            </motion.div>
            <h2 className="font-bold mb-3 text-3xl text-white">
              Welcome to Bucket!
            </h2>
            <p className="mb-8 text-gray-400 leading-relaxed">
              Track progress with 0-100% bars instead of checkboxes.
              <br />
              Create your first list to get started!
            </p>

            <div className="mb-6 space-y-3">
              <SyncImport />
              <div className="text-center">
                <SyncStatus />
              </div>
            </div>

            <Button
              onClick={() => {
                const name = prompt("List name:");
                if (name) actions.createList(name);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-black">
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

      {/* Unified Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-2 shrink-0">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePreviousScreen}
            disabled={!lists || lists.length <= 1}
            className="h-7 w-7 p-0 bg-gray-800 hover:bg-gray-700 disabled:opacity-30"
            aria-label="Previous list"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={handleNextScreen}
            disabled={!lists || lists.length <= 1}
            className="h-7 w-7 p-0 bg-gray-800 hover:bg-gray-700 disabled:opacity-30"
            aria-label="Next list"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {currentScreen && (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-lg">{currentScreen.emoji}</span>
              <span className="font-semibold text-white text-sm">
                {currentScreen.title}
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <SyncButton />

          <Button
            size="sm"
            onClick={onNavigateToCemetery}
            className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700"
            aria-label="Cemetery"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={() => setShowKeyboardHints(true)}
            className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700"
            title="Keyboard shortcuts (?)"
          >
            <span className="text-sm">?</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-black">
        {currentScreen && !isWideLayout && (
          <Screen
            className="h-full w-full p-4"
            key={String(currentScreen.id)}
            list={currentScreen as any}
            actions={actions}
          />
        )}

        {currentScreen && isWideLayout && (
          <div className="grid h-full grid-cols-2 gap-4 p-4">
            {/* Left: Current list tasks */}
            <div className="overflow-auto">
              <Screen
                className="h-full w-full"
                key={String(currentScreen.id)}
                list={currentScreen as any}
                actions={actions}
              />
            </div>

            {/* Right: List overview */}
            <div className="overflow-auto">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white mb-3">All Lists</h3>
                {lists?.map((list, index) => (
                  <div
                    key={String(list.id)}
                    className={`group relative w-full rounded-lg border p-3 transition-all ${
                      index === currentScreenIndex
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentScreenIndex(index)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{list.emoji}</span>
                        <span className="font-medium text-white text-sm">{list.title}</span>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete "${list.title}"?`)) {
                          actions.deleteList(String(list.id));
                          if (index === currentScreenIndex && lists.length > 1) {
                            setCurrentScreenIndex(Math.max(0, index - 1));
                          }
                        }
                      }}
                      className="absolute right-2 top-2 h-6 w-6 p-0 bg-red-600/80 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete list"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => {
                    const name = prompt("List name:");
                    if (name) actions.createList(name);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New List
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Input */}
      <div className="border-t border-gray-800 bg-gray-900 p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTask();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add task... (Cmd+N)"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

const Cemetery = ({ onNavigateBack }: { onNavigateBack: () => void }) => {
  const cemetery = useCemeteryItems();
  const lists = useLists();
  const actions = useActions();
  const [restoreToList, setRestoreToList] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleRestore = (itemId: string, listId: string) => {
    actions.restoreFromCemetery(itemId, listId);
    setRestoreToList(null);
    setSelectedItem(null);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-black">
      {/* Unified Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={onNavigateBack}
            className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700"
            aria-label="Back to lists"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl">🪦</span>
          <h1 className="font-bold text-white text-lg">Cemetery</h1>
        </div>
        <SyncButton />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!cemetery || cemetery.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="font-bold mb-4 text-6xl">⌫</div>
              <div className="text-xl text-gray-300">No deleted items</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {cemetery.map((item) => (
              <div
                key={String(item.id)}
                className="rounded-lg border border-gray-700 bg-gray-800/50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{item.originalTitle}</div>
                    {item.originalDescription && (
                      <div className="text-sm text-gray-500 truncate">{item.originalDescription}</div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      Progress: {item.originalProgress}% • {item.deletionReason}
                    </div>
                    <div className="text-xs text-gray-500">
                      Deleted {new Date(Number(item.deletedAt)).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedItem(String(item.id));
                        setRestoreToList(String(item.id));
                      }}
                      className="bg-green-600 text-white hover:bg-green-700 text-xs"
                    >
                      ↺
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm('Permanently delete this item?')) {
                          actions.permanentlyDelete(String(item.id));
                        }
                      }}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900/20 text-xs"
                    >
                      ×
                    </Button>
                  </div>
                </div>

                {/* Restore to list selector */}
                {restoreToList === String(item.id) && (
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    <p className="mb-2 text-sm text-gray-300">Restore to which list?</p>
                    <div className="flex flex-wrap gap-2">
                      {lists?.map((list) => (
                        <Button
                          key={String(list.id)}
                          size="sm"
                          onClick={() => handleRestore(String(item.id), String(list.id))}
                          className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
                        >
                          {list.emoji} {list.title}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        onClick={() => {
                          setRestoreToList(null);
                          setSelectedItem(null);
                        }}
                        variant="outline"
                        className="border-gray-600 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
