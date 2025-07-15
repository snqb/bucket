import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  store,
  getCurrentUser,
  syncNow,
  connectSync,
  disconnectSync,
  createList,
  createTask,
} from "./tinybase-store";

export function DataRecovery() {
  const [isOpen, setIsOpen] = useState(false);
  const [exportData, setExportData] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("");

  const handleExport = () => {
    try {
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        user: getCurrentUser(),
        lists: store.getTable("lists"),
        tasks: store.getTable("tasks"),
        cemetery: store.getTable("cemetery"),
      };

      const jsonData = JSON.stringify(data, null, 2);
      setExportData(jsonData);

      // Also copy to clipboard
      navigator.clipboard.writeText(jsonData).then(() => {
        setImportStatus("✅ Data exported and copied to clipboard!");
      });
    } catch (error) {
      setImportStatus("❌ Export failed: " + error.message);
    }
  };

  const handleImport = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);

      if (!data.version || data.version !== 1) {
        throw new Error("Invalid data format");
      }

      // Clear existing data
      store.delTables();

      // Import lists
      if (data.lists) {
        Object.entries(data.lists).forEach(([id, list]: [string, any]) => {
          store.setRow("lists", id, list);
        });
      }

      // Import tasks
      if (data.tasks) {
        Object.entries(data.tasks).forEach(([id, task]: [string, any]) => {
          store.setRow("tasks", id, task);
        });
      }

      // Import cemetery
      if (data.cemetery) {
        Object.entries(data.cemetery).forEach(([id, item]: [string, any]) => {
          store.setRow("cemetery", id, item);
        });
      }

      const listsCount = Object.keys(data.lists || {}).length;
      const tasksCount = Object.keys(data.tasks || {}).length;

      setImportStatus(
        `✅ Imported ${listsCount} lists and ${tasksCount} tasks successfully!`,
      );
    } catch (error) {
      setImportStatus("❌ Import failed: " + error.message);
    }
  };

  const handleSafeSync = async () => {
    try {
      setSyncStatus("🔄 Checking server data...");

      // First disconnect any existing sync
      await disconnectSync();

      // Get current local data count
      const localLists = store.getRowIds("lists").length;
      const localTasks = store.getRowIds("tasks").length;

      setSyncStatus(`📊 Local data: ${localLists} lists, ${localTasks} tasks`);

      // Connect with initial sync flag to pull first
      let connected = false;
      try {
        connected = await connectSync(true);
      } catch (connectError) {
        console.error("Connect error:", connectError);
        setSyncStatus(
          "❌ Could not connect to sync server: " + connectError.message,
        );
        return;
      }

      if (connected) {
        setSyncStatus("⏳ Waiting for server data...");

        // Wait longer for sync to complete and check progress
        let waitTime = 0;
        const maxWait = 15000; // 15 seconds max
        const checkInterval = 1000; // Check every second

        while (waitTime < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          waitTime += checkInterval;

          const newLists = store.getRowIds("lists").length;
          const newTasks = store.getRowIds("tasks").length;

          // Update status with progress
          setSyncStatus(
            `⏳ Syncing... ${waitTime / 1000}s (${newLists} lists, ${newTasks} tasks)`,
          );

          // If we got data, break early
          if (newLists > localLists || newTasks > localTasks) {
            break;
          }
        }

        const finalLists = store.getRowIds("lists").length;
        const finalTasks = store.getRowIds("tasks").length;

        if (finalLists > localLists || finalTasks > localTasks) {
          setSyncStatus(
            `✅ Sync complete: Retrieved ${finalLists - localLists} new lists and ${finalTasks - localTasks} new tasks`,
          );
        } else if (finalLists > 0 || finalTasks > 0) {
          setSyncStatus(
            `✅ Sync complete: ${finalLists} lists, ${finalTasks} tasks (no new data)`,
          );
        } else {
          setSyncStatus("⚠️ No data found on server - it might be empty");
        }
      } else {
        setSyncStatus("❌ Could not establish sync connection");
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncStatus("❌ Sync error: " + (error.message || "Unknown error"));
    }
  };

  const handleCreateTestData = () => {
    try {
      const listId = createList("Test List", "🧪");
      createTask(listId, "Test Task 1", "This is a test task");
      createTask(listId, "Test Task 2", "Another test task");
      setImportStatus("✅ Created test data");
    } catch (error) {
      setImportStatus("❌ Failed to create test data");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        className="fixed bottom-4 left-4 text-xs opacity-50 hover:opacity-100"
      >
        🛟 Data Recovery
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6">
            <h2 className="font-bold mb-4 text-xl">Data Recovery & Tools</h2>

            <div className="space-y-4">
              {/* Safe Sync Section */}
              <div className="rounded border border-gray-700 p-4">
                <h3 className="font-semibold mb-2">🔄 Safe Sync</h3>
                <p className="mb-3 text-sm text-gray-400">
                  Pull data from server without overwriting
                </p>
                <Button onClick={handleSafeSync} className="mb-2">
                  Pull from Server
                </Button>
                {syncStatus && (
                  <div className="text-sm text-gray-300">{syncStatus}</div>
                )}
              </div>

              {/* Export Section */}
              <div className="rounded border border-gray-700 p-4">
                <h3 className="font-semibold mb-2">📤 Export Data</h3>
                <p className="mb-3 text-sm text-gray-400">
                  Backup your current data
                </p>
                <Button onClick={handleExport} className="mb-2">
                  Export All Data
                </Button>
                {exportData && (
                  <textarea
                    value={exportData}
                    readOnly
                    className="mt-2 h-32 w-full rounded bg-gray-800 p-2 font-mono text-xs"
                  />
                )}
              </div>

              {/* Import Section */}
              <div className="rounded border border-gray-700 p-4">
                <h3 className="font-semibold mb-2">📥 Import Data</h3>
                <p className="mb-3 text-sm text-gray-400">
                  Restore from a backup (will replace current data)
                </p>
                <textarea
                  placeholder="Paste exported JSON here..."
                  onChange={(e) => handleImport(e.target.value)}
                  className="mb-2 h-32 w-full rounded bg-gray-800 p-2 font-mono text-xs"
                />
              </div>

              {/* Test Data */}
              <div className="rounded border border-gray-700 p-4">
                <h3 className="font-semibold mb-2">🧪 Test Data</h3>
                <p className="mb-3 text-sm text-gray-400">
                  Create sample data for testing
                </p>
                <Button onClick={handleCreateTestData}>Create Test Data</Button>
              </div>

              {/* Status Messages */}
              {importStatus && (
                <div className="rounded bg-gray-800 p-3 text-sm">
                  {importStatus}
                </div>
              )}

              {/* Current State Info */}
              <div className="rounded border border-gray-700 p-4 text-sm">
                <h3 className="font-semibold mb-2">📊 Current State</h3>
                <div className="space-y-1 text-gray-400">
                  <p>Lists: {store.getRowIds("lists").length}</p>
                  <p>Tasks: {store.getRowIds("tasks").length}</p>
                  <p>Cemetery: {store.getRowIds("cemetery").length}</p>
                  <p>User: {getCurrentUser().userId || "Not logged in"}</p>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
