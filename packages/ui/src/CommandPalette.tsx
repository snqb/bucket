import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Command } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fuzzy search implementation
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const searchQuery = query.toLowerCase();
    return commands
      .map((cmd) => {
        const label = cmd.label.toLowerCase();
        const description = cmd.description?.toLowerCase() || "";

        // Simple fuzzy matching: check if all query characters appear in order
        let queryIndex = 0;
        let score = 0;

        for (let i = 0; i < label.length && queryIndex < searchQuery.length; i++) {
          if (label[i] === searchQuery[queryIndex]) {
            queryIndex++;
            score += 100 - i; // Earlier matches score higher
          }
        }

        // Also check description
        if (queryIndex < searchQuery.length) {
          for (let i = 0; i < description.length && queryIndex < searchQuery.length; i++) {
            if (description[i] === searchQuery[queryIndex]) {
              queryIndex++;
              score += 50 - i;
            }
          }
        }

        // If all query characters matched, include this command
        if (queryIndex === searchQuery.length) {
          return { ...cmd, score };
        }

        return null;
      })
      .filter((cmd): cmd is Command & { score: number } => cmd !== null)
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...cmd }) => cmd);
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      const category = cmd.category || "Actions";
      if (!groups[category]) groups[category] = [];
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
        onClose();
      } else if ((e.key === "j" || e.key === "n") && e.ctrlKey) {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if ((e.key === "k" || e.key === "p") && e.ctrlKey) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Command palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-gray-700 px-4 py-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-base"
            />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>

          {/* Commands list */}
          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No commands found for "{query}"
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {category}
                  </div>
                  {cmds.map((cmd, idx) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:bg-gray-800"
                        }`}
                      >
                        {cmd.icon && (
                          <span className="text-xl">{cmd.icon}</span>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{cmd.label}</div>
                          {cmd.description && (
                            <div className={`text-xs mt-0.5 ${
                              isSelected ? "text-blue-100" : "text-gray-500"
                            }`}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className={`text-xs px-2 py-1 rounded border ${
                            isSelected
                              ? "border-blue-400 text-blue-100"
                              : "border-gray-700 text-gray-500"
                          }`}>
                            {cmd.shortcut}
                          </div>
                        )}
                        {isSelected && (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="border-t border-gray-700 px-4 py-2 flex items-center gap-4 text-xs text-gray-500">
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd> Close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
