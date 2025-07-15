import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import {
  store,
  getCurrentUser,
  connectSync,
  disconnectSync,
  syncNow,
  createList,
  createTask,
  deleteList,
  deleteTask,
} from "./tinybase-store";
import { useTable, useValues } from "tinybase/ui-react";

export function SyncDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [wsState, setWsState] = useState<string>("disconnected");
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const lists = useTable("lists", store);
  const tasks = useTable("tasks", store);
  const values = useValues(store);
  const currentUser = getCurrentUser();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSyncLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    // Listen to store changes
    const tableListener = store.addTablesListener(() => {
      const listsCount = Object.keys(lists).length;
      const tasksCount = Object.keys(tasks).length;
      addLog(`📦 Store updated: ${listsCount} lists, ${tasksCount} tasks`);
      setLastUpdate(Date.now());
    });

    // Monitor WebSocket through global variable if available
    const checkWsState = setInterval(() => {
      // @ts-ignore - accessing internal state
      const ws = window.__syncWebSocket;
      if (ws) {
        const states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
        setWsState(states[ws.readyState] || "UNKNOWN");
      } else {
        setWsState("NO_WEBSOCKET");
      }
    }, 1000);

    return () => {
      store.delListener(tableListener);
      clearInterval(checkWsState);
    };
  }, [lists, tasks]);

  const handleConnect = async () => {
    addLog("🔌 Attempting to connect...");
    try {
      const result = await connectSync(true);
      addLog(result ? "✅ Connected successfully" : "❌ Connection failed");
    } catch (error) {
      addLog(`❌ Connection error: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    addLog("🔌 Disconnecting...");
    try {
      await disconnectSync();
      addLog("✅ Disconnected");
    } catch (error) {
      addLog(`❌ Disconnect error: ${error.message}`);
    }
  };

  const handleManualSync = async () => {
    addLog("🔄 Manual sync triggered...");
    try {
      const result = await syncNow();
      addLog(result ? "✅ Sync completed" : "❌ Sync failed");
    } catch (error) {
      addLog(`❌ Sync error: ${error.message}`);
    }
  };

  const handleCreateTestData = () => {
    try {
      const listId = createList(`Test List ${Date.now()}`, "🧪");
      const taskId = createTask(listId, `Test Task ${Date.now()}`, "Test description");
      addLog(`✅ Created list ${listId} and task ${taskId}`);
    } catch (error) {
      addLog(`❌ Create error: ${error.message}`);
    }
  };

  const handleClearLocalData = () => {
    try {
      // Delete all lists and tasks
      Object.keys(lists).forEach(listId => deleteList(listId));
      Object.keys(tasks).forEach(taskId => deleteTask(taskId));
      addLog("🗑️ Cleared all local data");
    } catch (error) {
      addLog(`❌ Clear error: ${error.message}`);
    }
  };

  const exportStoreState = () => {
    const state = {
      user: currentUser,
      lists: store.getTable("lists"),
      tasks: store.getTable("tasks"),
      values: store.getValues(),
      cemetery: store.getTable("cemetery"),
    };
    return JSON.stringify(state, null, 2);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 text-xs opacity-50 hover:opacity-100"
      >
        🐛 Sync Debug
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-gray-900 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">🐛 Sync Debugger</h2>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            ✕
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Status & Controls */}
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="rounded border border-gray-700 p-4">
              <h3 className="font-semibold mb-2">📡 Connection Status</h3>
              <div className="space-y-2 text-sm">
                <p>User ID: <code className="bg-gray-800 px-1">{currentUser?.userId || "Not logged in"}</code></p>
                <p>WebSocket: <span className={wsState === "OPEN" ? "text-green-500" : "text-red-500"}>{wsState}</span></p>
                <p>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="rounded border border-gray-700 p-4">
              <h3 className="font-semibold mb-2">🔧 Sync Controls</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={handleConnect} size="sm" className="flex-1">
                    Connect
                  </Button>
                  <Button onClick={handleDisconnect} size="sm" variant="outline" className="flex-1">
                    Disconnect
                  </Button>
                </div>
                <Button onClick={handleManualSync} className="w-full">
                  🔄 Manual Sync Now
                </Button>
              </div>
            </div>

            {/* Test Data */}
            <div className="rounded border border-gray-700 p-4">
              <h3 className="font-semibold mb-2">🧪 Test Operations</h3>
              <div className="space-y-2">
                <Button onClick={handleCreateTestData} size="sm" className="w-full">
                  Create Test Data
                </Button>
                <Button onClick={handleClearLocalData} size="sm" variant="destructive" className="w-full">
                  Clear Local Data
                </Button>
              </div>
            </div>

            {/* Current Data */}
            <div className="rounded border border-gray-700 p-4">
              <h3 className="font-semibold mb-2">📊 Current Data</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>Lists: {Object.keys(lists).length}</p>
                <p>Tasks: {Object.keys(tasks).length}</p>
                <p>Cemetery: {Object.keys(store.getTable("cemetery")).length}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Logs & Data */}
          <div className="space-y-4">
            {/* Sync Logs */}
            <div className="rounded border border-gray-700 p-4">
              <h3 className="font-semibold mb-2">📜 Sync Logs</h3>
              <div className="h-48 overflow-y-auto bg-gray-800 rounded p-2 font-mono text-xs">
                {syncLogs.length === 0 ? (
                  <p className="text-gray-500">No logs yet...</p>
                ) : (
                  syncLogs.map((log, i) => (
                    <div key={i} className="text-gray-300">{log}</div>
                  ))
                )}
              </div>
            </div>

            {/* Store State */}
            <div className="rounded border border-gray-700 p-4">
              <h3 className="font-semibold mb-2">🗄️ Store State</h3>
              <textarea
                value={exportStoreState()}
                readOnly
                className="w-full h-64 bg-gray-800 rounded p-2 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 rounded bg-gray-800 p-4 text-sm">
          <h3 className="font-semibold mb-2">🔍 Debug Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>Open this debugger in two different browsers</li>
            <li>Login with the same passphrase in both</li>
            <li>Create test data in Browser 1</li>
            <li>Click "Manual Sync Now" in Browser 1</li>
            <li>Click "Connect" then "Manual Sync Now" in Browser 2</li>
            <li>Check if data appears in Browser 2</li>
            <li>Watch the sync logs for errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
