import "@testing-library/jest-dom";
import { vi } from "vitest";
import { setAutoSync } from "../tinybase-store";

// Disable auto-sync in tests
setAutoSync(false);

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
  const listeners = new Map<string, Array<(event: Event) => void>>();

  const ws = {
    url,
    readyState: 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(
      (type: string, listener: (event: Event) => void) => {
        if (!listeners.has(type)) {
          listeners.set(type, []);
        }
        listeners.get(type)!.push(listener);
      },
    ),
    removeEventListener: vi.fn(
      (type: string, listener: (event: Event) => void) => {
        const typeListeners = listeners.get(type);
        if (typeListeners) {
          const index = typeListeners.indexOf(listener);
          if (index > -1) {
            typeListeners.splice(index, 1);
          }
        }
      },
    ),
    dispatchEvent: vi.fn((event: Event) => {
      const typeListeners = listeners.get(event.type);
      if (typeListeners) {
        typeListeners.forEach((listener) => listener(event));
      }
      // Also trigger the on* handlers
      const handler = ws[`on${event.type}`];
      if (handler) handler(event);
    }),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };

  // Simulate connection after a tick
  setTimeout(() => {
    const openEvent = new Event("open");
    ws.dispatchEvent(openEvent);
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
