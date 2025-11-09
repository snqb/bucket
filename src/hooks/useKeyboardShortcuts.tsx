import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const metaMatch = shortcut.meta === undefined || shortcut.meta === e.metaKey;
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
};

export const KEYBOARD_SHORTCUTS = {
  NEW_LIST: { key: "n", description: "Create new list" },
  NEW_TASK: { key: "t", description: "Create new task" },
  SEARCH: { key: "k", ctrl: true, description: "Search" },
  HELP: { key: "?", shift: true, description: "Show keyboard shortcuts" },
  PREV_LIST: { key: "ArrowLeft", description: "Previous list" },
  NEXT_LIST: { key: "ArrowRight", description: "Next list" },
  ESCAPE: { key: "Escape", description: "Close dialog" },
};
