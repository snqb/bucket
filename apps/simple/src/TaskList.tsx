import { useState } from 'react';
import { useBucket } from './store';
import { Task } from './Task';

interface TaskListProps {
  bucketId: string;
}

export function TaskList({ bucketId }: TaskListProps) {
  const { buckets, addTask } = useBucket();
  const [newTaskText, setNewTaskText] = useState('');

  const bucket = buckets.find((b) => b.id === bucketId);

  if (!bucket) {
    return null;
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      addTask(bucketId, newTaskText.trim());
      setNewTaskText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {bucket.tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tasks yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Add your first task below to get started
            </p>
          </div>
        ) : (
          <div
            role="list"
            aria-label={`Tasks in ${bucket.name}`}
            className="space-y-4"
          >
            {bucket.tasks.map((task) => (
              <div key={task.id} role="listitem">
                <Task bucketId={bucketId} task={task} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-6">
        <form onSubmit={handleAddTask} className="flex gap-3">
          <label htmlFor="new-task-input" className="sr-only">
            Add new task to {bucket.name}
          </label>
          <input
            id="new-task-input"
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="New task description"
          />
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Add task"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
