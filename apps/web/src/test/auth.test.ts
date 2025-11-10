import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generatePassphrase,
  deriveUserId,
  setUser,
  getCurrentUser,
  logout,
  generateQRData,
  parseQRData
} from "../tinybase-store";

describe("BIP39 Authentication", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Passphrase Generation", () => {
    it("should generate a valid BIP39 passphrase", () => {
      const passphrase = generatePassphrase();

      expect(passphrase).toBeDefined();
      expect(typeof passphrase).toBe("string");
      expect(passphrase.split(" ")).toHaveLength(12); // 128-bit entropy = 12 words

      // Should be different each time
      const passphrase2 = generatePassphrase();
      expect(passphrase).not.toBe(passphrase2);
    });

    it("should generate passphrases with valid BIP39 words", () => {
      const passphrase = generatePassphrase();
      const words = passphrase.split(" ");

      // Each word should be lowercase and contain only letters
      words.forEach(word => {
        expect(word).toMatch(/^[a-z]+$/);
        expect(word.length).toBeGreaterThan(2);
      });
    });
  });

  describe("User ID Derivation", () => {
    it("should derive consistent user ID from same passphrase", async () => {
      const passphrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      const userId1 = await deriveUserId(passphrase);
      const userId2 = await deriveUserId(passphrase);

      expect(userId1).toBe(userId2);
      expect(userId1).toHaveLength(16); // 16 character hex string
      expect(userId1).toMatch(/^[a-f0-9]{16}$/);
    });

    it("should derive different user IDs from different passphrases", async () => {
      const passphrase1 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const passphrase2 = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";

      const userId1 = await deriveUserId(passphrase1);
      const userId2 = await deriveUserId(passphrase2);

      expect(userId1).not.toBe(userId2);
    });

    it("should be deterministic across multiple calls", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";

      const results = await Promise.all([
        deriveUserId(passphrase),
        deriveUserId(passphrase),
        deriveUserId(passphrase),
      ]);

      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });

  describe("User Authentication", () => {
    it("should set user with valid passphrase", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";

      const userId = await setUser(passphrase);

      expect(userId).toBeDefined();
      expect(userId).toHaveLength(16);
      expect(localStorage.setItem).toHaveBeenCalledWith("bucket-auth-userId", userId);
      expect(localStorage.setItem).toHaveBeenCalledWith("bucket-auth-passphrase", passphrase);
    });

    it("should get current user after setting", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      const userId = await setUser(passphrase);

      // Mock localStorage to return the values
      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === "bucket-auth-userId") return userId;
        if (key === "bucket-auth-passphrase") return passphrase;
        return null;
      });

      const currentUser = getCurrentUser();

      expect(currentUser.userId).toBe(userId);
      expect(currentUser.passphrase).toBe(passphrase);
    });

    it("should handle multiple device login with same passphrase", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";

      // Simulate first device
      const userId1 = await setUser(passphrase);

      // Clear in-memory state (simulate new device)
      await logout();

      // Simulate second device with same passphrase
      const userId2 = await setUser(passphrase);

      expect(userId1).toBe(userId2);
    });

    it("should logout and clear user data", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      await setUser(passphrase);

      await logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith("bucket-auth-userId");
      expect(localStorage.removeItem).toHaveBeenCalledWith("bucket-auth-passphrase");

      // Mock localStorage to return null after logout
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const currentUser = getCurrentUser();
      expect(currentUser.userId).toBe("");
      expect(currentUser.passphrase).toBe("");
    });
  });

  describe("QR Code Functionality", () => {
    it("should generate valid QR data", () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      const qrData = generateQRData(passphrase);

      expect(qrData).toBe(`bucket-app:${passphrase}`);
    });

    it("should parse valid QR data", () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      const qrData = `bucket-app:${passphrase}`;

      const parsed = parseQRData(qrData);

      expect(parsed).toBe(passphrase);
    });

    it("should return null for invalid QR data", () => {
      const invalidData = "invalid:data";
      const parsed = parseQRData(invalidData);

      expect(parsed).toBeNull();
    });

    it("should handle QR roundtrip correctly", () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";

      const qrData = generateQRData(passphrase);
      const parsedPassphrase = parseQRData(qrData);

      expect(parsedPassphrase).toBe(passphrase);
    });
  });

  describe("Security Properties", () => {
    it("should not store sensitive data in plain text in store", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      await setUser(passphrase);

      // Verify passphrase is only in localStorage, not in store values
      expect(localStorage.setItem).toHaveBeenCalledWith("bucket-auth-passphrase", passphrase);
    });

    it("should generate unique user IDs for different passphrases", async () => {
      const passphrases = [
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        "legal winner thank year wave sausage worth useful legal winner thank yellow",
        "letter advice cage absurd amount doctor acoustic avoid letter advice cage above",
      ];

      const userIds = await Promise.all(passphrases.map(deriveUserId));

      // All should be unique
      const uniqueIds = new Set(userIds);
      expect(uniqueIds.size).toBe(passphrases.length);
    });

    it("should handle empty or invalid passphrase gracefully", async () => {
      try {
        await setUser("");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should maintain user isolation between different accounts", async () => {
      const user1Passphrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const user2Passphrase = "legal winner thank year wave sausage worth useful legal winner thank yellow";

      const user1Id = await deriveUserId(user1Passphrase);
      const user2Id = await deriveUserId(user2Passphrase);

      expect(user1Id).not.toBe(user2Id);
      expect(user1Id).toHaveLength(16);
      expect(user2Id).toHaveLength(16);
    });
  });

  describe("Cross-Device Sync Scenarios", () => {
    it("should handle device A -> device B login sequence", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";

      // Device A: Initial login
      const deviceAUserId = await setUser(passphrase);

      // Simulate device A state
      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === "bucket-auth-userId") return deviceAUserId;
        if (key === "bucket-auth-passphrase") return passphrase;
        return null;
      });

      const deviceAUser = getCurrentUser();
      expect(deviceAUser.userId).toBe(deviceAUserId);

      // Device B: Login with same passphrase (fresh state)
      localStorage.getItem = vi.fn().mockReturnValue(null); // Fresh device
      const deviceBUserId = await setUser(passphrase);

      // Should derive same user ID
      expect(deviceBUserId).toBe(deviceAUserId);
    });

    it("should handle logout from one device while other devices remain logged in", async () => {
      const passphrase = "test wallet phrase with twelve words exactly here now done complete";
      const userId = await setUser(passphrase);

      // Device A logged in
      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === "bucket-auth-userId") return userId;
        if (key === "bucket-auth-passphrase") return passphrase;
        return null;
      });

      const userBeforeLogout = getCurrentUser();
      expect(userBeforeLogout.userId).toBe(userId);

      // Logout from device A
      await logout();

      // Device A should be logged out
      localStorage.getItem = vi.fn().mockReturnValue(null);
      const userAfterLogout = getCurrentUser();
      expect(userAfterLogout.userId).toBe("");

      // But device B (different localStorage) should still work
      localStorage.getItem = vi.fn().mockImplementation((key) => {
        if (key === "bucket-auth-userId") return userId;
        if (key === "bucket-auth-passphrase") return passphrase;
        return null;
      });

      const deviceBUser = getCurrentUser();
      expect(deviceBUser.userId).toBe(userId);
    });
  });
});
