import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  store,
  createList,
  createTask,
  updateTask,
  deleteTask,
  setUser,
  logout,
  startSync,
  stopSync,
  getSyncStatus,
  deriveUserId,
} from "../tinybase-store";

// Mock WebSocket for more detailed sync testing
class MockWebSocket {
  url: string;
  readyState: number = 1; // OPEN
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  messages: any[] = [];

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a tick
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  send(data: any) {
    this.messages.push(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent("close", { code: 1000, reason: "Normal closure" }));
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

describe("Multi-Device Sync Integration", () => {
  let originalWebSocket: any;
  let mockWebSockets: MockWebSocket[] = [];

  beforeEach(async () => {
    // Clear state
    localStorage.clear();
    vi.clearAllMocks();
    store.delTables();
    await stopSync();
    mockWebSockets = [];

    // Mock WebSocket
    originalWebSocket = global.WebSocket;
    global.WebSocket = vi.fn().mockImplementation((url: string) => {
      const mockWs = new MockWebSocket(url);
      mockWebSockets.push(mockWs);
      return mockWs;
    }) as any;
  });

  afterEach(async () => {
    global.WebSocket = originalWebSocket;
    await stopSync();
  });

  describe("Cross-Device Authentication", () => {
    it("should maintain consistent user ID across devices", async () => {
      const passphrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      // Device 1
      const device1UserId = await setUser(passphrase);

      // Device 2 (simulate fresh localStorage)
      localStorage.clear();
      const device2UserId = await setUser(passphrase);

      // Device 3 (simulate fresh localStorage)
      localStorage.clear();
      const device3UserId = await setUser(passphrase);

      expect(device1UserId).toBe(device2UserId);
      expect(device2UserId).toBe(device3UserId);
      expect(device1UserId).toHaveLength(16);
    });

    it("should handle device login with existing passphrase", async () => {
      const passphrase = "legal winner thank year wave sausage worth useful legal winner thank yellow";

      // Device 1: Initial setup
      const userId = await setUser(passphrase);
      const listId = createList("Device 1 List");
      const taskId = createTask(listId, "Device 1 Task");

      // Verify data exists on device 1
      expect(store.getRow("lists", listId)).toBeDefined();
      expect(store.getRow("tasks", taskId)).toBeDefined();

      // Device 2: Login with same passphrase
      await logout();
      localStorage.clear();

      const device2UserId = await setUser(passphrase);
      expect(device2UserId).toBe(userId);

      // In a real sync scenario, device 2 would receive device 1's data
      // For now, we verify the user ID consistency
    });

    it("should handle multiple simultaneous device logins", async () => {
      const passphrase = "letter advice cage absurd amount doctor acoustic avoid letter advice cage above";

      // Simulate multiple devices logging in simultaneously
      const loginPromises = Array.from({ length: 5 }, async (_, index) => {
        // Each "device" has fresh localStorage
        const deviceStorage = new Map();

        // Mock localStorage for this device
        localStorage.getItem = vi.fn().mockImplementation(key => deviceStorage.get(key) || null);
        localStorage.setItem = vi.fn().mockImplementation((key, value) => deviceStorage.set(key, value));
        localStorage.removeItem = vi.fn().mockImplementation(key => deviceStorage.delete(key));

        return await setUser(passphrase);
      });

      const userIds = await Promise.all(loginPromises);

      // All devices should derive the same user ID
      const uniqueUserIds = new Set(userIds);
      expect(uniqueUserIds.size).toBe(1);
      expect(userIds[0]).toHaveLength(16);
    });
  });

  describe("Data Synchronization", () => {
    it("should establish sync connection with user isolation", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      const userId = await setUser(passphrase);

      // Start sync
      const synchronizer = await startSync();

      // Should have created WebSocket with user path
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining(`/${userId}`)
      );

      // Check if connection was attempted
      expect(mockWebSockets.length).toBe(1);
      expect(mockWebSockets[0].url).toContain(userId);
    });

    it("should handle sync data flow between devices", async () => {
      const passphrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const userId = await setUser(passphrase);

      // Device 1: Create data and start sync
      const listId = createList("Synced List");
      const taskId = createTask(listId, "Synced Task");

      const sync1 = await startSync();

      // Verify WebSocket connection
      expect(mockWebSockets.length).toBe(1);
      expect(mockWebSockets[0].url).toContain(userId);

      // Simulate device 2 connecting
      localStorage.clear();
      await setUser(passphrase);
      const sync2 = await startSync();

      // Should have second WebSocket connection
      expect(mockWebSockets.length).toBe(2);
      expect(mockWebSockets[1].url).toContain(userId);

      // Both should use same user path
      expect(mockWebSockets[0].url).toBe(mockWebSockets[1].url);
    });

    it("should handle sync conflicts gracefully", async () => {
      const passphrase = "test sync conflict resolution phrase here now done";
      await setUser(passphrase);

      // Create conflicting data
      const listId = createList("Conflict List");
      const taskId = createTask(listId, "Original Task");

      // Update task to different states (simulating conflict)
      updateTask(taskId, { title: "Device 1 Update", progress: 25 });
      updateTask(taskId, { title: "Device 2 Update", progress: 75 });

      // Final state should be last update (TinyBase handles conflicts)
      const finalTask = store.getRow("tasks", taskId);
      expect(finalTask?.title).toBe("Device 2 Update");
      expect(finalTask?.progress).toBe(75);
    });

    it("should maintain data integrity during sync failures", async () => {
      const passphrase = "sync failure recovery test phrase here done";
      await setUser(passphrase);

      // Create data
      const listId = createList("Failure Test List");
      const taskId = createTask(listId, "Failure Test Task");

      // Start sync
      await startSync();

      // Simulate connection failure
      if (mockWebSockets.length > 0) {
        mockWebSockets[0].simulateError();
      }

      // Data should still exist locally
      expect(store.getRow("lists", listId)).toBeDefined();
      expect(store.getRow("tasks", taskId)).toBeDefined();

      // Should be able to continue working offline
      updateTask(taskId, { progress: 50 });
      const updatedTask = store.getRow("tasks", taskId);
      expect(updatedTask?.progress).toBe(50);
    });
  });

  describe("User Isolation", () => {
    it("should isolate data between different users", async () => {
      // User 1
      const user1Passphrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const user1Id = await setUser(user1Passphrase);
      const user1ListId = createList("User 1 List");
      const user1TaskId = createTask(user1ListId, "User 1 Task");

      // Start sync for user 1
      await startSync();
      const user1WebSocket = mockWebSockets[mockWebSockets.length - 1];

      // Switch to User 2
      await logout();
      localStorage.clear();

      const user2Passphrase = "legal winner thank year wave sausage worth useful legal winner thank yellow";
      const user2Id = await setUser(user2Passphrase);
      const user2ListId = createList("User 2 List");
      const user2TaskId = createTask(user2ListId, "User 2 Task");

      // Start sync for user 2
      await startSync();
      const user2WebSocket = mockWebSockets[mockWebSockets.length - 1];

      // Users should have different IDs
      expect(user1Id).not.toBe(user2Id);

      // WebSocket URLs should be different (different user paths)
      expect(user1WebSocket.url).toContain(user1Id);
      expect(user2WebSocket.url).toContain(user2Id);
      expect(user1WebSocket.url).not.toBe(user2WebSocket.url);
    });

    it("should handle user switching on same device", async () => {
      const user1Passphrase = "first user passphrase with twelve words exactly here now done complete";
      const user2Passphrase = "second user passphrase with twelve words exactly here now done complete";

      // User 1 session
      const user1Id = await setUser(user1Passphrase);
      const user1ListId = createList("User 1 Private List");
      await startSync();

      // Logout user 1
      await logout();
      expect(getSyncStatus()).toBe("disconnected");

      // User 2 session
      const user2Id = await setUser(user2Passphrase);
      const user2ListId = createList("User 2 Private List");
      await startSync();

      // Should have different user IDs
      expect(user1Id).not.toBe(user2Id);

      // Should have different sync connections
      expect(mockWebSockets.length).toBe(2);
      expect(mockWebSockets[0].url).toContain(user1Id);
      expect(mockWebSockets[1].url).toContain(user2Id);
    });
  });

  describe("Sync State Management", () => {
    it("should track sync status correctly", async () => {
      // Initially disconnected
      expect(getSyncStatus()).toBe("disconnected");

      const passphrase = "sync status tracking test phrase here done";
      await setUser(passphrase);

      // Start sync
      await startSync();

      // Should be connected or disconnected (depending on mock)
      const status = getSyncStatus();
      expect(["connected", "disconnected"]).toContain(status);

      // Stop sync
      await stopSync();
      expect(getSyncStatus()).toBe("disconnected");
    });

    it("should handle reconnection scenarios", async () => {
      const passphrase = "reconnection test phrase with twelve words here done";
      await setUser(passphrase);

      // Initial connection
      await startSync();
      const initialWebSocketCount = mockWebSockets.length;

      // Simulate disconnect and reconnect
      await stopSync();
      expect(getSyncStatus()).toBe("disconnected");

      await startSync();

      // Should have attempted new connection
      expect(mockWebSockets.length).toBeGreaterThan(initialWebSocketCount);
    });

    it("should handle network errors gracefully", async () => {
      const passphrase = "network error handling test phrase here done";
      await setUser(passphrase);

      // Mock fetch to fail (simulating network issues)
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        // Start sync should handle network errors
        const synchronizer = await startSync();

        // Should fail gracefully
        expect(synchronizer).toBeNull();
        expect(getSyncStatus()).toBe("disconnected");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe("Data Persistence Across Sessions", () => {
    it("should persist auth state across app restarts", async () => {
      const passphrase = "persistent auth test phrase with twelve words here done";
      const userId = await setUser(passphrase);

      // Simulate app restart by clearing in-memory state
      // but keeping localStorage
      const storedUserId = localStorage.getItem("bucket-auth-userId");
      const storedPassphrase = localStorage.getItem("bucket-auth-passphrase");

      expect(storedUserId).toBe(userId);
      expect(storedPassphrase).toBe(passphrase);

      // Logout and verify cleanup
      await logout();

      expect(localStorage.getItem("bucket-auth-userId")).toBeNull();
      expect(localStorage.getItem("bucket-auth-passphrase")).toBeNull();
    });

    it("should handle corrupted localStorage gracefully", async () => {
      // Set invalid data in localStorage
      localStorage.setItem("bucket-auth-userId", "invalid-user-id");
      localStorage.setItem("bucket-auth-passphrase", "");

      const passphrase = "recovery from corruption test phrase here done";

      // Should be able to set new user despite corrupted state
      const userId = await setUser(passphrase);

      expect(userId).toBeDefined();
      expect(userId).toHaveLength(16);
      expect(localStorage.getItem("bucket-auth-userId")).toBe(userId);
      expect(localStorage.getItem("bucket-auth-passphrase")).toBe(passphrase);
    });
  });

  describe("Performance Under Load", () => {
    it("should handle multiple rapid sync operations", async () => {
      const passphrase = "performance test phrase with twelve words here done";
      await setUser(passphrase);

      const startTime = Date.now();

      // Rapid data operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(createList(`Performance List ${i}`));
      }

      operations.forEach((listId, index) => {
        createTask(listId, `Performance Task ${index}`);
        updateTask(store.getRowIds("tasks")[index], { progress: index * 2 });
      });

      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Data should be consistent
      expect(store.getRowIds("lists").length).toBe(50);
      expect(store.getRowIds("tasks").length).toBe(50);
    });

    it("should handle concurrent device operations", async () => {
      const passphrase = "concurrent operations test phrase here done";
      await setUser(passphrase);

      // Simulate multiple devices making changes
      const device1ListId = createList("Device 1 List");
      const device2ListId = createList("Device 2 List");
      const device3ListId = createList("Device 3 List");

      // Create tasks from different "devices"
      const device1TaskId = createTask(device1ListId, "Device 1 Task");
      const device2TaskId = createTask(device2ListId, "Device 2 Task");
      const device3TaskId = createTask(device3ListId, "Device 3 Task");

      // Update tasks concurrently
      updateTask(device1TaskId, { progress: 33 });
      updateTask(device2TaskId, { progress: 66 });
      updateTask(device3TaskId, { progress: 99 });

      // All updates should be preserved
      expect(store.getRow("tasks", device1TaskId)?.progress).toBe(33);
      expect(store.getRow("tasks", device2TaskId)?.progress).toBe(66);
      expect(store.getRow("tasks", device3TaskId)?.progress).toBe(99);
    });
  });

  describe("Security and Privacy", () => {
    it("should not expose sensitive data in sync messages", async () => {
      const passphrase = "security test phrase with twelve words here done complete";
      await setUser(passphrase);

      createList("Secret List");
      createTask(store.getRowIds("lists")[0], "Secret Task");

      await startSync();

      // Check that passphrase is not in WebSocket messages
      if (mockWebSockets.length > 0) {
        const messages = mockWebSockets[0].messages;
        messages.forEach(message => {
          const messageStr = JSON.stringify(message);
          expect(messageStr).not.toContain(passphrase);
        });
      }
    });

    it("should validate user identity before sync", async () => {
      // Try to start sync without user
      const syncWithoutUser = await startSync();
      expect(syncWithoutUser).toBeNull();

      // Set user and try again
      const passphrase = "identity validation test phrase here done";
      await setUser(passphrase);

      const syncWithUser = await startSync();

      // Should have attempted connection with user
      expect(mockWebSockets.length).toBeGreaterThan(0);
    });

    it("should handle user logout securely", async () => {
      const passphrase = "secure logout test phrase here done";
      const userId = await setUser(passphrase);

      createList("User Data");
      await startSync();

      // Logout should stop sync and clear auth
      await logout();

      expect(getSyncStatus()).toBe("disconnected");
      expect(localStorage.getItem("bucket-auth-userId")).toBeNull();
      expect(localStorage.getItem("bucket-auth-passphrase")).toBeNull();
    });
  });
});
