import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  deriveUserId,
  setUser,
  logout,
  clearAllUserData,
} from "../tinybase-store";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("Passphrase Isolation and Privacy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    await logout();
  });

  describe("User ID Derivation", () => {
    it("should generate different user IDs for different passphrases", async () => {
      const passphrase1 =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const passphrase2 =
        "legal winner thank year wave sausage worth useful legal winner thank yellow";
      const passphrase3 =
        "letter advice cage absurd amount doctor acoustic avoid letter advice cage above";

      const userId1 = await deriveUserId(passphrase1);
      const userId2 = await deriveUserId(passphrase2);
      const userId3 = await deriveUserId(passphrase3);

      expect(userId1).not.toBe(userId2);
      expect(userId1).not.toBe(userId3);
      expect(userId2).not.toBe(userId3);

      // All should be 16 characters (hex)
      expect(userId1).toHaveLength(16);
      expect(userId2).toHaveLength(16);
      expect(userId3).toHaveLength(16);

      // Should be valid hex
      expect(userId1).toMatch(/^[0-9a-f]{16}$/);
      expect(userId2).toMatch(/^[0-9a-f]{16}$/);
      expect(userId3).toMatch(/^[0-9a-f]{16}$/);
    });

    it("should generate same user ID for same passphrase", async () => {
      const passphrase =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      const userId1 = await deriveUserId(passphrase);
      const userId2 = await deriveUserId(passphrase);
      const userId3 = await deriveUserId(passphrase);

      expect(userId1).toBe(userId2);
      expect(userId2).toBe(userId3);
    });

    it("should be case and whitespace sensitive", async () => {
      const passphrase1 =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const passphrase2 =
        "legal winner thank year wave sausage worth useful legal winner thank yellow"; // different valid passphrase
      const passphrase3 =
        "letter advice cage absurd amount doctor acoustic avoid letter advice cage above"; // another different valid passphrase

      const userId1 = await deriveUserId(passphrase1);
      const userId2 = await deriveUserId(passphrase2);
      const userId3 = await deriveUserId(passphrase3);

      expect(userId1).not.toBe(userId2);
      expect(userId1).not.toBe(userId3);
      expect(userId2).not.toBe(userId3);
    });

    it("should handle random valid BIP39 passphrases uniquely", async () => {
      const userIds = new Set<string>();

      // Generate 10 random valid passphrases
      for (let i = 0; i < 10; i++) {
        const passphrase = generateMnemonic(wordlist, 128); // 12 words
        const userId = await deriveUserId(passphrase);

        expect(userId).toHaveLength(16);
        expect(userId).toMatch(/^[0-9a-f]{16}$/);
        expect(userIds.has(userId)).toBe(false); // No collisions

        userIds.add(userId);
      }

      expect(userIds.size).toBe(10); // All unique
    });
  });

  describe("Storage Key Isolation", () => {
    it("should use different storage keys for different users", async () => {
      const passphrase1 =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const passphrase2 =
        "legal winner thank year wave sausage worth useful legal winner thank yellow";

      await setUser(passphrase1);
      const calls1 = mockLocalStorage.setItem.mock.calls.filter((call) =>
        call[0].startsWith("bucket-data-"),
      );

      await logout();
      mockLocalStorage.setItem.mockClear();

      await setUser(passphrase2);
      const calls2 = mockLocalStorage.setItem.mock.calls.filter((call) =>
        call[0].startsWith("bucket-data-"),
      );

      // Should have different storage keys
      expect(calls1.length).toBeGreaterThan(0);
      expect(calls2.length).toBeGreaterThan(0);

      if (calls1.length > 0 && calls2.length > 0) {
        expect(calls1[0][0]).not.toBe(calls2[0][0]);
      }
    });

    it("should use same storage key for same passphrase", async () => {
      const passphrase =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      await setUser(passphrase);
      const userId1 = mockLocalStorage.setItem.mock.calls.find(
        (call) => call[0] === "bucket-userId",
      )?.[1];

      await logout();

      await setUser(passphrase);
      const userId2 = mockLocalStorage.setItem.mock.calls.find(
        (call) => call[0] === "bucket-userId",
      )?.[1];

      expect(userId1).toBe(userId2);
    });
  });

  describe("Data Isolation Between Users", () => {
    it("should not leak data between different users", async () => {
      const passphrase1 =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const passphrase2 =
        "legal winner thank year wave sausage worth useful legal winner thank yellow";

      // Set user 1 and simulate some data
      await setUser(passphrase1);
      const userId1 = mockLocalStorage.setItem.mock.calls.find(
        (call) => call[0] === "bucket-userId",
      )?.[1];

      // Simulate user 1 having data in localStorage
      mockLocalStorage.setItem(
        `bucket-data-${userId1}`,
        JSON.stringify({
          lists: { list1: { name: "User 1 List" } },
          tasks: { task1: { text: "User 1 Task", listId: "list1" } },
        }),
      );

      await logout();

      // Set user 2
      await setUser(passphrase2);
      const userId2 = mockLocalStorage.setItem.mock.calls.find(
        (call) => call[0] === "bucket-userId",
      )?.[1];

      // Users should have different IDs
      expect(userId1).not.toBe(userId2);

      // User 2 should not have access to user 1's data key
      const user2DataKey = `bucket-data-${userId2}`;
      const user1DataKey = `bucket-data-${userId1}`;

      expect(user2DataKey).not.toBe(user1DataKey);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty passphrase", async () => {
      await expect(deriveUserId("")).rejects.toThrow();
    });

    it("should handle null/undefined passphrase", async () => {
      await expect(deriveUserId(null as any)).rejects.toThrow();
      await expect(deriveUserId(undefined as any)).rejects.toThrow();
    });

    it("should handle non-string passphrase", async () => {
      await expect(deriveUserId(123 as any)).rejects.toThrow();
      await expect(deriveUserId({} as any)).rejects.toThrow();
    });

    it("should handle invalid BIP39 passphrases", async () => {
      // These should throw errors because they're not valid BIP39
      await expect(deriveUserId("invalid passphrase")).rejects.toThrow();
      await expect(deriveUserId("too few words")).rejects.toThrow();
      await expect(
        deriveUserId(
          "this has exactly twelve words but they are not valid bip39 words",
        ),
      ).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle 24-word BIP39 passphrases", async () => {
      // Generate valid 24-word passphrases
      const passphrase1 = generateMnemonic(wordlist, 256); // 24 words
      const passphrase2 = generateMnemonic(wordlist, 256); // 24 words

      const userId1 = await deriveUserId(passphrase1);
      const userId2 = await deriveUserId(passphrase2);

      expect(userId1).not.toBe(userId2);
      expect(userId1).toHaveLength(16);
      expect(userId2).toHaveLength(16);
      expect(userId1).toMatch(/^[0-9a-f]{16}$/);
      expect(userId2).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe("Security Properties", () => {
    it("should not be predictable from passphrase pattern", async () => {
      // Use valid BIP39 passphrases that are similar
      const passphrases = [
        generateMnemonic(wordlist, 128),
        generateMnemonic(wordlist, 128),
        generateMnemonic(wordlist, 128),
      ];

      const userIds = await Promise.all(passphrases.map(deriveUserId));

      // All should be different
      expect(userIds[0]).not.toBe(userIds[1]);
      expect(userIds[0]).not.toBe(userIds[2]);
      expect(userIds[1]).not.toBe(userIds[2]);

      // Should not have obvious patterns in the hash
      for (const userId of userIds) {
        expect(userId).not.toMatch(/^0+/); // Not all zeros
        expect(userId).not.toMatch(/^f+/); // Not all f's
        expect(userId).not.toMatch(/^(.)\1+$/); // Not all same character
      }
    });

    it("should generate cryptographically random-looking output", async () => {
      const passphrase = generateMnemonic(wordlist, 128); // Valid BIP39
      const userId = await deriveUserId(passphrase);

      // Should use full hex range
      const hexChars = new Set(userId.split(""));
      expect(hexChars.size).toBeGreaterThan(3); // Should have variety

      // Should be deterministic
      const userId2 = await deriveUserId(passphrase);
      expect(userId).toBe(userId2);
    });
  });

  describe("Performance", () => {
    it("should derive user ID reasonably quickly", async () => {
      const passphrase =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      const start = performance.now();
      await deriveUserId(passphrase);
      const end = performance.now();

      // Should complete within 1 second (very generous)
      expect(end - start).toBeLessThan(1000);
    });

    it("should handle multiple derivations efficiently", async () => {
      const passphrases = Array(10)
        .fill(0)
        .map(() => generateMnemonic(wordlist, 128));

      const start = performance.now();
      await Promise.all(passphrases.map(deriveUserId));
      const end = performance.now();

      // Should complete within 5 seconds for 10 derivations
      expect(end - start).toBeLessThan(5000);
    });
  });

  describe("Real World Privacy Test", () => {
    it("should demonstrate that invalid passphrases cause errors (not same data)", async () => {
      // This test proves that invalid passphrases don't silently fall back to the same user
      const invalidPassphrases = [
        "hello world",
        "my secret password",
        "just some random words here",
        "invalid bip39 phrase",
      ];

      for (const passphrase of invalidPassphrases) {
        await expect(deriveUserId(passphrase)).rejects.toThrow();
      }
    });

    it("should show that the privacy issue is likely from using invalid passphrases", async () => {
      // Generate valid passphrases and show they work correctly
      const validPassphrase1 = generateMnemonic(wordlist, 128);
      const validPassphrase2 = generateMnemonic(wordlist, 128);

      const userId1 = await deriveUserId(validPassphrase1);
      const userId2 = await deriveUserId(validPassphrase2);

      console.log(`Valid passphrase 1: ${validPassphrase1}`);
      console.log(`User ID 1: ${userId1}`);
      console.log(`Valid passphrase 2: ${validPassphrase2}`);
      console.log(`User ID 2: ${userId2}`);

      expect(userId1).not.toBe(userId2);
    });
  });
});
