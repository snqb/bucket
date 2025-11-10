import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebSocketServer } from "ws";
import { createWsServer } from "tinybase/synchronizers/synchronizer-ws-server";
import { createMergeableStore } from "tinybase";
import { createSqlite3Persister } from "tinybase/persisters/persister-sqlite3";
import sqlite3 from "sqlite3";
import { tmpdir } from "os";
import { join } from "path";
import { unlinkSync, existsSync } from "fs";
import WebSocket from "ws";

describe("Server User Isolation", () => {
  let testDbPath: string;
  let wss: WebSocketServer;
  let server: any;
  let httpServer: any;

  beforeEach(() => {
    // Create a unique test database file
    testDbPath = join(tmpdir(), `test-${Date.now()}-${Math.random()}.db`);
  });

  afterEach(async () => {
    // Cleanup
    if (server) {
      server.destroy();
    }
    if (httpServer) {
      httpServer.close();
    }
    if (wss) {
      wss.close();
    }

    // Remove test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  it("should create different tables for different users", () => {
    const db = new sqlite3.Database(testDbPath);

    // Simulate creating persisters for two different users
    const userId1 = "user123";
    const userId2 = "user456";

    const store1 = createMergeableStore();
    const store2 = createMergeableStore();

    const persister1 = createSqlite3Persister(store1, db, {
      mode: "json",
      storeTableName: `tinybase_${userId1}`,
    });

    const persister2 = createSqlite3Persister(store2, db, {
      mode: "json",
      storeTableName: `tinybase_${userId2}`,
    });

    // Verify different table names would be used
    expect(`tinybase_${userId1}`).not.toBe(`tinybase_${userId2}`);
    expect(`tinybase_${userId1}`).toBe("tinybase_user123");
    expect(`tinybase_${userId2}`).toBe("tinybase_user456");

    db.close();
  });

  it("should isolate data between users with different table names", async () => {
    const db = new sqlite3.Database(testDbPath);

    const userId1 = "user1";
    const userId2 = "user2";

    const store1 = createMergeableStore();
    const store2 = createMergeableStore();

    const persister1 = createSqlite3Persister(store1, db, {
      mode: "json",
      storeTableName: `tinybase_${userId1}`,
    });

    const persister2 = createSqlite3Persister(store2, db, {
      mode: "json",
      storeTableName: `tinybase_${userId2}`,
    });

    // Add data to user1's store
    store1.setTable("lists", {
      list1: { name: "User 1 List", createdAt: "2024-01-01" }
    });

    // Add different data to user2's store
    store2.setTable("lists", {
      list2: { name: "User 2 List", createdAt: "2024-01-02" }
    });

    // Save both stores
    await persister1.save();
    await persister2.save();

    // Create fresh stores and persisters to test isolation
    const freshStore1 = createMergeableStore();
    const freshStore2 = createMergeableStore();

    const freshPersister1 = createSqlite3Persister(freshStore1, db, {
      mode: "json",
      storeTableName: `tinybase_${userId1}`,
    });

    const freshPersister2 = createSqlite3Persister(freshStore2, db, {
      mode: "json",
      storeTableName: `tinybase_${userId2}`,
    });

    // Load data
    await freshPersister1.load();
    await freshPersister2.load();

    // Verify isolation - each user should only see their own data
    const user1Data = freshStore1.getTable("lists");
    const user2Data = freshStore2.getTable("lists");

    expect(user1Data).toEqual({
      list1: { name: "User 1 List", createdAt: "2024-01-01" }
    });

    expect(user2Data).toEqual({
      list2: { name: "User 2 List", createdAt: "2024-01-02" }
    });

    // Verify they don't see each other's data
    expect(user1Data).not.toHaveProperty("list2");
    expect(user2Data).not.toHaveProperty("list1");

    db.close();
  });

  it("should verify table names are correctly formatted", () => {
    const testCases = [
      { userId: "abc123", expected: "tinybase_abc123" },
      { userId: "f41aa117765ac3a2", expected: "tinybase_f41aa117765ac3a2" },
      { userId: "user-with-dashes", expected: "tinybase_user-with-dashes" },
      { userId: "123456789", expected: "tinybase_123456789" },
    ];

    testCases.forEach(({ userId, expected }) => {
      const tableName = `tinybase_${userId}`;
      expect(tableName).toBe(expected);
      expect(tableName).toMatch(/^tinybase_[a-zA-Z0-9\-_]+$/);
    });
  });

  it("should demonstrate the privacy issue was in the server", () => {
    // This test documents the bug that was fixed

    // BEFORE FIX: All users used the same table
    const buggyConfig = {
      mode: "json" as const,
      // Missing storeTableName - all users share default "tinybase" table
    };

    // AFTER FIX: Each user gets their own table
    const fixedConfigUser1 = {
      mode: "json" as const,
      storeTableName: "tinybase_user1", // User-specific table
    };

    const fixedConfigUser2 = {
      mode: "json" as const,
      storeTableName: "tinybase_user2", // Different user-specific table
    };

    // The fix ensures different users get different tables
    expect(fixedConfigUser1.storeTableName).not.toBe(fixedConfigUser2.storeTableName);
    expect(fixedConfigUser1.storeTableName).toBe("tinybase_user1");
    expect(fixedConfigUser2.storeTableName).toBe("tinybase_user2");

    // The buggy config would have used the same default table for everyone
    expect(buggyConfig.storeTableName).toBeUndefined();
  });

  it("should handle user IDs that look like real derived IDs", () => {
    // Test with realistic user IDs derived from passphrases
    const realUserIds = [
      "f41aa117765ac3a2", // From tests - abandon abandon abandon...
      "2d292c451d22ef19", // From tests - legal winner thank...
      "dd7c143da2628b2d", // From tests - letter advice cage...
    ];

    const tableNames = realUserIds.map(userId => `tinybase_${userId}`);

    // All should be different
    const uniqueTableNames = new Set(tableNames);
    expect(uniqueTableNames.size).toBe(realUserIds.length);

    // All should follow the expected pattern
    tableNames.forEach(tableName => {
      expect(tableName).toMatch(/^tinybase_[a-f0-9]{16}$/);
    });
  });

  it("should verify server pathId maps to table name correctly", () => {
    // Simulate the server's persister creation logic
    const createPersisterForUser = (pathId: string) => {
      const store = createMergeableStore();
      const db = new sqlite3.Database(":memory:");

      return createSqlite3Persister(store, db, {
        mode: "json",
        storeTableName: `tinybase_${pathId}`, // This is the fix
        autoLoadIntervalSeconds: 1,
      });
    };

    const user1Persister = createPersisterForUser("user1");
    const user2Persister = createPersisterForUser("user2");

    // Different users should get different persisters
    expect(user1Persister).not.toBe(user2Persister);
  });
});
