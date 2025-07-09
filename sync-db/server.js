#!/usr/bin/env node

import { WebSocketServer } from "ws";
import { createWsServer } from "tinybase/synchronizers/synchronizer-ws-server";
import { createMergeableStore } from "tinybase";
import { createSqlite3Persister } from "tinybase/persisters/persister-sqlite3";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8040;
const DB_FILE = process.env.NODE_ENV === 'production'
  ? '/tmp/storage.db'
  : join(__dirname, "storage.db");

console.log("🚀 Starting TinyBase sync server with SQLite...");
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);

// Create HTTP server for health checks
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Create WebSocket server with user isolation
const server = createWsServer(
  new WebSocketServer({
    server: httpServer,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  }),
  // Create a persister for each user (pathId = userId)
  (pathId) => {
    const store = createMergeableStore();

    // Use SQLite with user-specific table prefix
    const db = new sqlite3.Database(DB_FILE);
    const persister = createSqlite3Persister(store, db, {
      mode: "tabular",
      autoLoadIntervalSeconds: 1,
      storeTableName: `store_${pathId}`,
      valuesTableName: `values_${pathId}`,
    });

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

// Start the HTTP server
httpServer.listen(PORT, process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost', () => {
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  console.log(`🔄 TinyBase sync server running on ws://${host}:${PORT}`);
  console.log(`📁 Data will be persisted to SQLite: ${DB_FILE}`);
  console.log(`🏥 Health check available at: http://${host}:${PORT}/health`);
  console.log("🔌 Waiting for client connections...");
  console.log(`💡 Connect with: ws://${host}:${PORT}/<userId>`);
});

// Handle server shutdown gracefully
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down sync server...");
  server.destroy();
  httpServer.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down sync server...");
  server.destroy();
  httpServer.close();
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
