import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock crypto.subtle for testing
Object.defineProperty(global, "crypto", {
  value: {
    subtle: {
      digest: vi
        .fn()
        .mockImplementation(
          (algorithm: string, data: ArrayBuffer | Uint8Array) => {
            // Simple mock hash for testing
            const hash = new Uint8Array(32);
            let sourceData: Uint8Array;

            if (data instanceof ArrayBuffer) {
              sourceData = new Uint8Array(data);
            } else if (data instanceof Uint8Array) {
              sourceData = data;
            } else {
              // Convert Buffer or other data to Uint8Array
              sourceData = new Uint8Array(data);
            }

            for (let i = 0; i < Math.min(sourceData.length, 32); i++) {
              hash[i] = sourceData[i] ^ 0xaa; // Simple XOR for deterministic hash
            }
            return Promise.resolve(hash.buffer);
          },
        ),
    },
    getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
});

// Mock WebSocket for sync tests
global.WebSocket = vi.fn().mockImplementation((url: string) => {
  const ws = {
    url,
    readyState: 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };

  // Simulate connection after a tick
  setTimeout(() => {
    if (ws.onopen) ws.onopen(new Event("open"));
  }, 0);

  return ws;
}) as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});
