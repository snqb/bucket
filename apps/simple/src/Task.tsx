import { useBucket } from './store';

interface TaskProps {
  bucketId: string;
  task: {
    id: string;
    text: string;
    progress: number;
    createdAt: number;
  };
}

export function Task({ bucketId, task }: TaskProps) {
  const { updateTaskProgress, deleteTask } = useBucket();

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value, 10);
    updateTaskProgress(bucketId, task.id, newProgress);
  };

  const handleDelete = () => {
    if (confirm(`Delete task "${task.text}"?`)) {
      deleteTask(bucketId, task.id);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
      role="group"
      aria-labelledby={`task-${task.id}-label`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          id={`task-${task.id}-label`}
          className="text-base font-medium text-gray-900 flex-1"
        >
          {task.text}
        </h3>
        <button
          onClick={handleDelete}
          className="ml-3 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded p-1 transition-colors"
          aria-label={`Delete task: ${task.text}`}
          type="button"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={task.progress}
          onChange={handleProgressChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={`Progress for ${task.text}: ${task.progress} percent`}
          aria-valuenow={task.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${task.progress} percent complete`}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${task.progress}%, #e5e7eb ${task.progress}%, #e5e7eb 100%)`,
          }}
        />
        <span
          className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right"
          aria-live="polite"
          aria-atomic="true"
        >
          {task.progress}%
        </span>
      </div>
    </div>
  );
}
