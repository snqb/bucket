import { useState } from 'react';
import { useBucket } from './store';

export function BucketList() {
  const { buckets, currentBucketId, addBucket, deleteBucket, setCurrentBucket } =
    useBucket();
  const [isAdding, setIsAdding] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');

  const handleAddBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBucketName.trim()) {
      addBucket(newBucketName.trim());
      setNewBucketName('');
      setIsAdding(false);
    }
  };

  const handleDeleteBucket = (id: string, name: string) => {
    if (confirm(`Delete list "${name}"? This will delete all tasks in it.`)) {
      deleteBucket(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, bucketId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCurrentBucket(bucketId);
    }
  };

  return (
    <nav
      className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col"
      aria-label="Bucket lists navigation"
    >
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Bucket</h1>
        <p className="text-sm text-gray-600 mt-1">Simple task management</p>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4"
        role="list"
        aria-label="Your lists"
      >
        {buckets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No lists yet</p>
            <p className="text-gray-400 text-xs mt-2">Create your first list below</p>
          </div>
        ) : (
          buckets.map((bucket) => {
            const isActive = bucket.id === currentBucketId;
            const taskCount = bucket.tasks.length;
            const completedCount = bucket.tasks.filter((t) => t.progress === 100).length;

            return (
              <div
                key={bucket.id}
                role="listitem"
                className={`group mb-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600' : 'hover:bg-gray-200'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentBucket(bucket.id)}
                  onKeyDown={(e) => handleKeyDown(e, bucket.id)}
                  className={`flex items-center justify-between p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${
                    isActive ? 'text-white' : 'text-gray-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${bucket.name}, ${completedCount} of ${taskCount} tasks completed`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{bucket.name}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isActive ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {completedCount}/{taskCount} tasks
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBucket(bucket.id, bucket.name);
                    }}
                    className={`ml-2 p-1 rounded hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                    aria-label={`Delete list: ${bucket.name}`}
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
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        {isAdding ? (
          <form onSubmit={handleAddBucket} className="space-y-2">
            <label htmlFor="new-bucket-input" className="sr-only">
              New list name
            </label>
            <input
              id="new-bucket-input"
              type="text"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              placeholder="List name..."
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="New list name"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newBucketName.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewBucketName('');
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            aria-label="Create new list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New List
          </button>
        )}
      </div>
    </nav>
  );
}
