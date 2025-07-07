import ReloadPrompt from "./ReloadPrompt";
import { SyncStatus } from "./SyncStatus";
import { UserAuth } from "./UserAuth";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import {
  useLists,
  useCemeteryItems,
  useActions,
  useAuth,
} from "./tinybase-hooks";
import { randomEmoji } from "./emojis";
import { Link, Route, Switch } from "wouter";

function App() {
  const { isAuthenticated } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <UserAuth onAuthenticated={setUserId} />;
  }

  return (
    <>
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
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [showMap, setShowMap] = useState(false);

  // Reset current screen index if it's out of bounds
  useEffect(() => {
    if (lists && lists.length > 0 && currentScreenIndex >= lists.length) {
      setCurrentScreenIndex(0);
    }
  }, [lists, currentScreenIndex]);

  const currentScreen = lists?.[currentScreenIndex];

  // Handle case when no lists exist
  if (!lists || lists.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 text-6xl">📋</div>
          <div className="mb-8 text-xl text-gray-300">No lists yet</div>
          <div className="mb-4">
            <SyncStatus />
          </div>
          <Button
            className="bg-blue-500 bg-opacity-50 p-4 text-xl text-white hover:bg-blue-600 hover:bg-opacity-70"
            onClick={() => {
              const name = prompt("Enter the name of your first todo list");
              if (name) {
                actions.createList(name);
              }
            }}
          >
            Create your first list
          </Button>
        </div>
      </div>
    );
  }

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousScreen();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextScreen();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleMapClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lists]);

  if (showMap) {
    return (
      <div className="flex h-screen w-screen flex-col bg-black">
        {/* Header */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-2xl text-white">All Lists</h1>
            <div className="flex items-center gap-4">
              <SyncStatus />
              <div className="flex gap-2">
                <Link
                  to="/cemetery"
                  className="flex size-10 items-center justify-center bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                >
                  🪦
                </Link>
                <Button
                  className="size-10 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                  onClick={() => {
                    const name = prompt("Enter the name of the new todo list");
                    if (name) {
                      actions.createList(name);
                    }
                  }}
                >
                  ➕
                </Button>
                <Button
                  className="size-10 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                  onClick={handleMapClick}
                >
                  ❌
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid flex-1 grid-cols-4 gap-4 overflow-auto p-4">
          {lists?.map((list, index) => (
            <motion.div
              key={String(list.id)}
              className="group relative aspect-square cursor-pointer border border-gray-600 bg-gray-800 bg-opacity-50 p-4 transition-colors hover:bg-opacity-70"
              onClick={() => handleScreenSelect(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="mb-2 cursor-pointer text-2xl transition-transform hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  const newEmoji = randomEmoji();
                  actions.updateListEmoji(String(list.id), newEmoji);
                }}
              >
                {list.emoji}
              </div>
              <div className="font-medium truncate text-sm">{list.title}</div>

              {/* Edit/Delete buttons - only show on hover */}
              <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 bg-black bg-opacity-50 p-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newName = prompt(`${list.title} -> to what?`);
                    if (newName) {
                      actions.updateListTitle(String(list.id), newName);
                    }
                  }}
                >
                  ✏️
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 bg-black bg-opacity-50 p-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirm = window.confirm(`Delete ${list.title}?`);
                    if (confirm) {
                      actions.deleteList(String(list.id));
                    }
                  }}
                >
                  🗑️
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-black">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                className="size-8 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                onClick={handlePreviousScreen}
                disabled={!lists || lists.length <= 1}
              >
                ←
              </Button>
              <Button
                className="size-8 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
                onClick={handleNextScreen}
                disabled={!lists || lists.length <= 1}
              >
                →
              </Button>
            </div>
            {currentScreen && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentScreen.emoji}</span>
                <h1 className="font-bold text-2xl text-white">
                  {currentScreen.title}
                </h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <SyncStatus />
            <Button
              className="size-8 bg-blue-500 bg-opacity-50 text-white hover:bg-blue-600 hover:bg-opacity-70"
              onClick={handleMapClick}
            >
              🗺️
            </Button>
          </div>
        </div>
      </div>

      {/* Screen Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen && (
          <Screen
            className="h-full w-full border-0 p-8"
            key={String(currentScreen.id)}
            list={currentScreen}
          />
        )}
      </div>
    </div>
  );
};

const Cemetery = () => {
  const cemetery = useCemeteryItems();

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
              <div className="mb-4 text-6xl">🪦</div>
              <div className="text-xl text-gray-300">No deleted items</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {cemetery.map((it) => (
              <div
                key={String(it.id)}
                className="rounded border border-gray-700 bg-gray-800 bg-opacity-50 p-3"
              >
                <div className="font-medium text-white">{it.originalTitle}</div>
                <div className="text-sm text-gray-400">
                  Deleted {new Date(Number(it.deletedAt)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
