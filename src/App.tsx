import ReloadPrompt from "./ReloadPrompt";
import { SyncStatus } from "./SyncStatus";
import { SyncButton } from "./SyncButton";
import { DataRecovery } from "./DataRecovery";
import { UserAuth } from "./UserAuth";
import { UserControls } from "./UserControls";
import { AddListDialog } from "./components/AddListDialog";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import {
  useLists,
  useCemeteryItems,
  useActions,
  useAuth,
} from "./tinybase-hooks";
import { hasLocalData } from "./tinybase-store";
import { randomEmoji } from "./emojis";
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
          // Generate anonymous passphrase and auto-login
          const { generatePassphrase } = await import('./tinybase-store');
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

      <ReloadPrompt />
    </>
  );
}

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

  // Better loading logic to prevent premature empty state
  useEffect(() => {
    const checkInitialization = async () => {
      const hasData = hasLocalData();
      const hasStoredUser = !!(
        localStorage.getItem("bucket-userId") &&
        localStorage.getItem("bucket-passphrase")
      );

      if (hasData) {
        // Have data, show immediately
        setIsInitializing(false);
      } else if (hasStoredUser) {
        // User exists but no data yet, wait longer for potential sync
        console.log(
          "🔄 User exists but no data, waiting for potential sync...",
        );
        const timer = setTimeout(() => {
          console.log("⏰ Done waiting, showing UI");
          setIsInitializing(false);
        }, 2500);
        return () => clearTimeout(timer);
      } else {
        // First-time user, shorter delay
        const timer = setTimeout(() => setIsInitializing(false), 500);
        return () => clearTimeout(timer);
      }
    };

    checkInitialization();
  }, []);

  // Reset current screen index if it's out of bounds
  useEffect(() => {
    if (lists && lists.length > 0 && currentScreenIndex >= lists.length) {
      setCurrentScreenIndex(0);
    }
  }, [lists, currentScreenIndex]);

  const handleMapClick = () => {
    setShowMap(!showMap);
  };

  const handleScreenSelect = (index: number) => {
    setCurrentScreenIndex(index);
    setShowMap(false);
  };

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

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: "n",
        handler: () => setShowAddListDialog(true),
        description: "Create new list",
      },
      {
        key: "c",
        handler: () => setLocation("/cemetery"),
        description: "Open cemetery",
      },
      {
        key: "m",
        handler: () => setShowMap(!showMap),
        description: "Toggle map view",
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
          setShowMap(false);
          setShowAddListDialog(false);
        },
        description: "Close dialogs",
      },
    ],
    !!lists && lists.length > 0
  );

  const currentScreen = lists?.[currentScreenIndex];

  // More intelligent loading state
  const shouldShowLoading = () => {
    const hasData = hasLocalData();
    const hasStoredUser = !!(
      localStorage.getItem("bucket-userId") &&
      localStorage.getItem("bucket-passphrase")
    );

    // Show loading if:
    // 1. Auth is still loading AND no local data exists
    // 2. Still initializing AND (no data OR expecting data but don't have it)
    return (
      (isLoading && !hasData) || (isInitializing && (!hasData || hasStoredUser))
    );
  };

  if (shouldShowLoading()) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="font-bold mb-4 text-4xl">...</div>
          <div className="text-sm text-gray-400">
            {hasLocalData() ? "Syncing..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  // Handle case when no lists exist - with additional safety check
  if (!lists || lists.length === 0) {
    const hasStoredUser = !!(
      localStorage.getItem("bucket-userId") &&
      localStorage.getItem("bucket-passphrase")
    );

    // If user exists but no lists, show warning
    if (hasStoredUser && !isInitializing) {
      console.warn("⚠️ User has credentials but no lists found");
    }

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
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
            {hasStoredUser ? (
              <>
                Your lists will appear here once synced.
                <br />
                Check your connection or try syncing manually.
              </>
            ) : (
              <>
                Track progress with 0-100% bars instead of checkboxes.
                <br />
                Create your first list to get started!
              </>
            )}
          </p>

          <div className="mb-6">
            <SyncStatus />
          </div>

          <AddListDialog
            onAdd={(name) => actions.createList(name)}
            variant="button"
            className="p-6 text-lg shadow-lg"
          />

          {!hasStoredUser && (
            <div className="mt-8 space-y-2 text-left rounded-lg border border-gray-700 bg-gray-900 bg-opacity-50 p-4">
              <p className="text-sm text-gray-400">💡 Quick tips:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Tasks use progress bars (0-100%), not checkboxes</li>
                <li>• Reach 100% to auto-complete with confetti 🎊</li>
                <li>• Deleted tasks go to cemetery for recovery</li>
                <li>• Everything syncs across your devices</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleEditList = (listId: string, currentTitle: string) => {
    setEditingListId(listId);
    setEditingListTitle(currentTitle);
  };

  const handleSaveEdit = () => {
    if (editingListId && editingListTitle.trim()) {
      actions.updateListTitle(editingListId, editingListTitle.trim());
    }
    setEditingListId(null);
    setEditingListTitle("");
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditingListTitle("");
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-black">
      {/* Desktop Grid View - Always visible on desktop */}
      <div className="hidden md:flex md:h-screen md:w-screen md:flex-col md:bg-black">
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-2xl text-white">All Lists</h1>
            <div className="flex items-center gap-4">
              <SyncStatus />
              <div className="flex gap-2">
                <Link
                  to="/cemetery"
                  className="font-bold flex size-10 items-center justify-center bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                  aria-label="View cemetery"
                >
                  <Trash2 className="h-5 w-5" />
                </Link>
                <AddListDialog
                  onAdd={(name) => actions.createList(name)}
                  open={showAddListDialog}
                  onOpenChange={setShowAddListDialog}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3  xl:grid-cols-4">
            {lists?.map((list) => (
              <div key={String(list.id)} className="group relative">
                <div className="absolute -right-2 -top-2 z-10 hidden gap-1 group-hover:flex">
                  <Button
                    size="sm"
                    className="h-6 w-6 bg-black bg-opacity-70 p-0 text-white hover:bg-gray-900"
                    onClick={() =>
                      handleEditList(String(list.id), String(list.title))
                    }
                    aria-label="Edit list"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 w-6 bg-black bg-opacity-70 p-0 text-white hover:bg-gray-900"
                    onClick={() => {
                      if (confirm(`Delete ${list.title}?`)) {
                        actions.deleteList(String(list.id));
                      }
                    }}
                    aria-label="Delete list"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {editingListId === String(list.id) ? (
                  <div className="min-h-[200px] rounded-lg border border-blue-500 bg-gray-800 bg-opacity-50 p-4">
                    <input
                      type="text"
                      value={editingListTitle}
                      onChange={(e) => setEditingListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="mb-2 w-full rounded bg-gray-700 p-2 text-sm text-white"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="bg-green-600 text-white"
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCancelEdit}
                        className="bg-red-600 text-white"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Screen className="w-full" list={list as any} actions={actions} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-700 p-4">
          <UserControls />
        </div>
      </div>

      {/* Mobile Views - Toggle between single screen and grid */}
      <div className="md:hidden">
        {showMap ? (
          <div className="flex h-screen w-screen flex-col bg-black">
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl text-white">All Lists</h1>
                <div className="flex items-center gap-4">
                  <SyncStatus />
                  <div className="flex gap-2">
                    <Link
                      to="/cemetery"
                      className="font-bold flex size-10 items-center justify-center bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                      aria-label="View cemetery"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Link>
                    <AddListDialog onAdd={(name) => actions.createList(name)} />
                    <Button
                      className="size-10 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                      onClick={handleMapClick}
                      aria-label="Close map view"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-4 overflow-auto p-4">
              {lists?.map((list, index) => (
                <MobileListCard
                  key={String(list.id)}
                  list={list}
                  index={index}
                  onSelect={() => handleScreenSelect(index)}
                  onEdit={(newTitle) =>
                    actions.updateListTitle(String(list.id), newTitle)
                  }
                  onDelete={() => actions.deleteList(String(list.id))}
                  onEmojiChange={(emoji) =>
                    actions.updateListEmoji(String(list.id), emoji)
                  }
                />
              ))}
            </div>

            <div className="border-t border-gray-700 p-4">
              <UserControls />
            </div>
          </div>
        ) : (
          <div className="flex h-screen w-screen flex-col bg-black">
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <Button
                      className="size-8 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                      onClick={handlePreviousScreen}
                      disabled={!lists || lists.length <= 1}
                      aria-label="Previous list"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      className="size-8 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                      onClick={handleNextScreen}
                      disabled={!lists || lists.length <= 1}
                      aria-label="Next list"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {currentScreen && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentScreen.emoji}</span>
                      {editingMobileTitle ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={mobileTitle}
                            onChange={(e) => setMobileTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (mobileTitle.trim()) {
                                  actions.updateListTitle(
                                    String(currentScreen.id),
                                    mobileTitle.trim()
                                  );
                                }
                                setEditingMobileTitle(false);
                              }
                              if (e.key === "Escape") {
                                setMobileTitle(String(currentScreen.title));
                                setEditingMobileTitle(false);
                              }
                            }}
                            className="font-bold rounded px-2 py-1 text-xl text-white bg-gray-700 border border-gray-600"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (mobileTitle.trim()) {
                                actions.updateListTitle(
                                  String(currentScreen.id),
                                  mobileTitle.trim()
                                );
                              }
                              setEditingMobileTitle(false);
                            }}
                            className="h-6 w-6 bg-green-600 p-0 text-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <h1
                          onClick={() => {
                            setMobileTitle(String(currentScreen.title));
                            setEditingMobileTitle(true);
                          }}
                          className="font-bold cursor-pointer rounded px-1 text-2xl text-white hover:bg-gray-700"
                        >
                          {currentScreen.title}
                        </h1>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <SyncStatus />
                  <Button
                    className="size-8 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                    onClick={handleMapClick}
                    aria-label="Show all lists"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {currentScreen && (
                <Screen
                  className="h-full w-full border-0 p-8"
                  key={String(currentScreen.id)}
                  list={currentScreen as any}
                  actions={actions}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Cemetery = () => {
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
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl text-white">Cemetery</h1>
          <div className="flex items-center gap-4">
            <SyncStatus />
            <Link
              to="/"
              className="flex size-8 items-center justify-center bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
            >
              🪣
            </Link>
          </div>
        </div>
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
          <div className="space-y-2">
            {cemetery.map((item) => (
              <div
                key={String(item.id)}
                className="rounded border border-gray-700 bg-gray-800 bg-opacity-50 p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.originalTitle}</div>
                    {item.originalDescription && (
                      <div className="text-sm text-gray-500">{item.originalDescription}</div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      Progress: {item.originalProgress}% • {item.deletionReason}
                    </div>
                    <div className="text-xs text-gray-500">
                      Deleted {new Date(Number(item.deletedAt)).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedItem(String(item.id));
                        setRestoreToList(String(item.id));
                      }}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      ↺ Restore
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm('Permanently delete this item?')) {
                          actions.permanentlyDelete(String(item.id));
                        }
                      }}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900 hover:bg-opacity-20"
                    >
                      × Delete
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
                          className="bg-blue-600 text-white hover:bg-blue-700"
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
                        className="border-gray-600"
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

const MobileListCard = ({
  list,
  index,
  onSelect,
  onEdit,
  onDelete,
  onEmojiChange,
}: {
  list: any;
  index: number;
  onSelect: () => void;
  onEdit: (newTitle: string) => void;
  onDelete: () => void;
  onEmojiChange: (emoji: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (!isExpanded) {
      onSelect();
    }
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(editTitle.trim());
    }
    setIsEditing(false);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setEditTitle(list.title);
    setIsEditing(false);
    setIsExpanded(false);
  };

  return (
    <motion.div
      className="group relative aspect-square cursor-pointer border border-gray-600 bg-gray-800 bg-opacity-50 p-4 transition-colors"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={isExpanded ? undefined : onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: isExpanded ? 1.05 : 1,
        zIndex: isExpanded ? 10 : 1,
        backgroundColor: isExpanded
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(31, 41, 55, 0.5)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="mb-2 text-2xl transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          if (isExpanded) {
            const newEmoji = randomEmoji();
            onEmojiChange(newEmoji);
          }
        }}
      >
        {list.emoji}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded bg-gray-700 p-1 text-sm text-white"
            autoFocus
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-green-600 text-xs text-white"
            >
              ✓
            </Button>
            <Button
              size="sm"
              onClick={handleCancel}
              className="bg-red-600 text-xs text-white"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="font-medium truncate text-sm">{list.title}</div>
      )}

      {isExpanded && !isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center space-y-3 rounded bg-gray-800 bg-opacity-90 p-4"
        >
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (confirm(`Delete ${list.title}?`)) {
                onDelete();
              }
            }}
            className="w-full bg-red-600 text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="w-full bg-gray-600 text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default App;
