import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardHintsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  { keys: ["j", "↓"], description: "Next item", category: "Navigation" },
  { keys: ["k", "↑"], description: "Previous item", category: "Navigation" },
  { keys: ["h", "←"], description: "Previous list", category: "Navigation" },
  { keys: ["l", "→"], description: "Next list", category: "Navigation" },
  { keys: ["g", "g"], description: "Go to top", category: "Navigation" },
  { keys: ["G"], description: "Go to bottom", category: "Navigation" },

  // Actions
  { keys: ["n"], description: "New list", category: "Actions" },
  { keys: ["t"], description: "New task", category: "Actions" },
  { keys: ["e"], description: "Edit selected", category: "Actions" },
  { keys: ["d"], description: "Delete selected", category: "Actions" },
  { keys: ["x"], description: "Toggle complete", category: "Actions" },
  { keys: ["r"], description: "Rename list", category: "Actions" },

  // Progress
  { keys: ["+", "="], description: "Increase progress", category: "Progress" },
  { keys: ["-"], description: "Decrease progress", category: "Progress" },
  { keys: ["0"], description: "Reset to 0%", category: "Progress" },
  { keys: ["1"], description: "Set to 100%", category: "Progress" },

  // Search & Filter
  { keys: ["⌘", "K"], description: "Command palette", category: "Search" },
  { keys: ["/"], description: "Quick search", category: "Search" },
  { keys: ["Esc"], description: "Clear search / Close", category: "Search" },

  // Views
  { keys: ["c"], description: "Cemetery view", category: "Views" },
  { keys: ["m"], description: "Toggle map", category: "Views" },
  { keys: ["?"], description: "Show shortcuts", category: "Views" },
];

export function KeyboardHints({ isOpen, onClose }: KeyboardHintsProps) {
  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Hints panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4 bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Keyboard className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Shortcuts grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(groupedShortcuts).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="text-gray-300 text-sm">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded text-gray-300 shadow-sm min-w-[28px] text-center">
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span className="text-gray-600 text-xs">or</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 px-6 py-3 bg-gray-800/30">
            <p className="text-xs text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">?</kbd> anytime to toggle this panel
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
