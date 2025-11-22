import { useState } from "react";
import { Palette } from "lucide-react";

// 16-color palette with semantic names
const COLORS = [
  { name: "slate", bg: "bg-slate-700", ring: "ring-slate-500", hex: "#334155" },
  { name: "red", bg: "bg-red-700", ring: "ring-red-500", hex: "#b91c1c" },
  { name: "orange", bg: "bg-orange-700", ring: "ring-orange-500", hex: "#c2410c" },
  { name: "amber", bg: "bg-amber-700", ring: "ring-amber-500", hex: "#b45309" },
  { name: "yellow", bg: "bg-yellow-700", ring: "ring-yellow-500", hex: "#a16207" },
  { name: "lime", bg: "bg-lime-700", ring: "ring-lime-500", hex: "#4d7c0f" },
  { name: "green", bg: "bg-green-700", ring: "ring-green-500", hex: "#15803d" },
  { name: "emerald", bg: "bg-emerald-700", ring: "ring-emerald-500", hex: "#047857" },
  { name: "teal", bg: "bg-teal-700", ring: "ring-teal-500", hex: "#0f766e" },
  { name: "cyan", bg: "bg-cyan-700", ring: "ring-cyan-500", hex: "#0e7490" },
  { name: "sky", bg: "bg-sky-700", ring: "ring-sky-500", hex: "#0369a1" },
  { name: "blue", bg: "bg-blue-700", ring: "ring-blue-500", hex: "#1d4ed8" },
  { name: "indigo", bg: "bg-indigo-700", ring: "ring-indigo-500", hex: "#4338ca" },
  { name: "violet", bg: "bg-violet-700", ring: "ring-violet-500", hex: "#6d28d9" },
  { name: "purple", bg: "bg-purple-700", ring: "ring-purple-500", hex: "#7e22ce" },
  { name: "pink", bg: "bg-pink-700", ring: "ring-pink-500", hex: "#be185d" },
];

interface ColorPickerProps {
  currentColor?: string;
  onColorSelect: (colorHex: string) => void;
}

export function ColorPicker({ currentColor, onColorSelect }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the current color from the palette (or use first color as default)
  const selectedColor = COLORS.find((c) => c.hex === currentColor) || COLORS[0];

  return (
    <div className="relative">
      {/* Trigger button - shows current color */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-8 w-8 items-center justify-center rounded-md ${selectedColor.bg} hover:opacity-80 transition-opacity`}
        aria-label="Choose list color"
        title="Choose color"
      >
        <Palette className="h-4 w-4 text-white" />
      </button>

      {/* Color palette dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Palette grid */}
          <div className="absolute right-0 top-10 z-20 grid grid-cols-4 gap-2 rounded-lg bg-gray-800 border border-gray-600 p-3 shadow-lg">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  onColorSelect(color.hex);
                  setIsOpen(false);
                }}
                className={`h-8 w-8 rounded-md ${color.bg} hover:opacity-80 transition-opacity ${
                  color.hex === currentColor
                    ? `ring-2 ${color.ring} ring-offset-2 ring-offset-gray-800`
                    : ""
                }`}
                aria-label={`Select ${color.name} color`}
                title={color.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Export the color palette for use in other components (like Task component for bar colors)
export { COLORS };
