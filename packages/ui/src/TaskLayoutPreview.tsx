import { useState } from "react";
import { motion } from "framer-motion";

interface LayoutPreviewProps {
  taskTitle: string;
  progress: number;
}

const layouts = [
  {
    id: 1,
    name: "Compact Stack",
    height: "60px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex flex-col gap-1.5 py-2 px-4">
        <p className="text-sm font-medium text-white truncate">{taskTitle}</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            readOnly
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
            }}
          />
          <span className="text-xs font-mono font-bold text-white w-10 text-right">
            {progress}%
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    name: "Title with Percentage Badge",
    height: "65px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex flex-col gap-1.5 py-2 px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white truncate flex-1">
            {taskTitle}
          </p>
          <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded text-xs font-mono font-bold text-white">
            {progress}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          readOnly
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
          }}
        />
      </div>
    ),
  },
  {
    id: 3,
    name: "Mini Progress Pill",
    height: "60px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex flex-col gap-1.5 py-2 px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white truncate flex-1">
            {taskTitle}
          </p>
          <div className="ml-2 flex gap-0.5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < progress / 10 ? "bg-blue-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          readOnly
          className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
          }}
        />
      </div>
    ),
  },
  {
    id: 4,
    name: "Overlaid Slider Background",
    height: "40px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="relative py-2 px-4">
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/15 to-transparent"
          style={{
            width: `${progress}%`,
            opacity: progress > 0 ? 1 : 0,
          }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white truncate flex-1">
            {taskTitle}
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            readOnly
            className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer opacity-40"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
            }}
          />
          <span className="text-xs font-mono font-bold text-white w-10 text-right">
            {progress}%
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    name: "Split View with Divider",
    height: "40px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex items-center gap-3 py-2 px-4">
        <p className="text-sm font-medium text-white truncate w-[40%]">
          {taskTitle}
        </p>
        <div className="w-px h-6 bg-gray-600" />
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          readOnly
          className="flex-1 min-w-[120px] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
          }}
        />
        <span className="text-xs font-mono font-bold text-white w-10 text-right">
          {progress}%
        </span>
      </div>
    ),
  },
  {
    id: 6,
    name: "Percentage as Subtitle",
    height: "60px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex flex-col gap-1.5 py-2 px-4">
        <p className="text-sm font-medium text-white truncate">{taskTitle}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 w-10">
            {progress}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            readOnly
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
            }}
          />
        </div>
      </div>
    ),
  },
  {
    id: 7,
    name: "Condensed Title + Big Slider",
    height: "55px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex flex-col gap-1 py-2 px-4">
        <p className="text-xs font-medium text-gray-300 uppercase tracking-wide truncate">
          {taskTitle}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            readOnly
            className="flex-1 h-3.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
            }}
          />
          <span className="text-sm font-mono font-bold text-white w-10 text-right">
            {progress}%
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    name: "Gradient Transition",
    height: "50px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="relative py-2 px-4">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/30 to-blue-500/20"
          style={{
            width: `${progress}%`,
            opacity: progress > 0 ? 1 : 0,
          }}
        />
        <div className="relative flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white truncate flex-1">
              {taskTitle}
            </p>
            <span className="ml-2 text-xs font-mono font-bold text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    name: "Title Over Faint Slider",
    height: "65px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="relative py-3 px-4">
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600/30"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="relative flex items-center justify-between">
          <p className="text-sm font-medium text-white px-2 bg-gray-900/80 rounded truncate flex-1">
            {taskTitle}
          </p>
          <span className="ml-2 text-xs font-mono font-bold text-white px-2 bg-gray-900/80 rounded">
            {progress}%
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    name: "Corner Percentage",
    height: "55px",
    render: ({ taskTitle, progress }: LayoutPreviewProps) => (
      <div className="flex flex-col gap-1.5 py-2 px-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-white truncate flex-1 pr-2">
            {taskTitle}
          </p>
          <span className="text-[10px] font-mono font-bold text-gray-400">
            {progress}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          readOnly
          className="w-[80%] mx-auto h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`,
          }}
        />
      </div>
    ),
  },
];

export const TaskLayoutPreview = () => {
  const [selectedLayout, setSelectedLayout] = useState<number | null>(null);

  const sampleTasks = [
    { title: "Test native HTML slider", progress: 89 },
    { title: "elixir with full monitoring", progress: 45 },
    { title: "Short task", progress: 20 },
    { title: "A very long task title that goes on and on", progress: 75 },
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Task Layout Options
        </h1>
        <p className="text-gray-400 mb-8">
          Click any layout to see it in action. Each shows 4 sample tasks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {layouts.map((layout) => (
            <div key={layout.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  {layout.id}. {layout.name}
                </h3>
                <span className="text-xs text-gray-500">{layout.height}</span>
              </div>

              <motion.div
                className={`rounded-lg border ${
                  selectedLayout === layout.id
                    ? "border-blue-500 ring-2 ring-blue-500/50"
                    : "border-gray-700"
                } overflow-hidden cursor-pointer hover:border-gray-600 transition-all`}
                onClick={() =>
                  setSelectedLayout(
                    selectedLayout === layout.id ? null : layout.id
                  )
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-gray-900 space-y-2 p-2">
                  {sampleTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-950 rounded border border-gray-800"
                      style={{ height: layout.height }}
                    >
                      {layout.render({
                        taskTitle: task.title,
                        progress: task.progress,
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>

              {selectedLayout === layout.id && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-blue-400 font-medium"
                >
                  ✓ Selected - Click again to deselect
                </motion.p>
              )}
            </div>
          ))}
        </div>

        {selectedLayout && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Selected: Option {selectedLayout}
            </h3>
            <p className="text-gray-400 text-sm">
              When you're ready, let me know and I'll implement this layout in
              the main Task component.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
