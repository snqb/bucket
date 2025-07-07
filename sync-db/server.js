#!/usr/bin/env node

import { WebSocketServer } from "ws";
import { createWsServer } from "tinybase/synchronizers/synchronizer-ws-server";
import { createMergeableStore } from "tinybase";
import { createFilePersister } from "tinybase/persisters/persister-file";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8040;
const DATA_FILE = join(__dirname, "bucket-sync-data.json");

console.log("🚀 Starting TinyBase sync server...");

// Create WebSocket server with user isolation
const server = createWsServer(
  new WebSocketServer({ port: PORT }),
  // Create a persister for each user (pathId = userId)
  (pathId) => {
    const store = createMergeableStore();

    // Use separate file for each user
    const userDataFile = join(__dirname, `user-${pathId}.json`);
    const persister = createFilePersister(store, userDataFile);

    // Auto-load existing data for this user
    persister
      .startAutoLoad()
      .then(() => {
        console.log(`📁 Loaded data for user: ${pathId}`);
      })
      .catch(() => {
        console.log(`📁 No existing data for user: ${pathId} (new user)`);
      });

    // Auto-save changes
    persister.startAutoSave();

    return persister;
  },
);

console.log(`🔄 TinyBase sync server running on ws://localhost:${PORT}`);
console.log(`📁 User data will be persisted to: ${__dirname}/user-*.json`);
console.log("🔌 Waiting for client connections...");
console.log("💡 Connect with: ws://localhost:8040/<userId>");

// Handle server shutdown gracefully
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down sync server...");
  server.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down sync server...");
  server.destroy();
  process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});
