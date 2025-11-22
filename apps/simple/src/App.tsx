import { BucketProvider, useBucket } from './store';
import { BucketList } from './BucketList';
import { TaskList } from './TaskList';

function AppContent() {
  const { buckets, currentBucketId, addBucket } = useBucket();

  const handleCreateFirstBucket = () => {
    const name = prompt('Enter a name for your first list:');
    if (name?.trim()) {
      addBucket(name.trim());
    }
  };

  if (buckets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Bucket
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            A simple, accessible task management app built with clean technology.
          </p>
          <button
            onClick={handleCreateFirstBucket}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Create your first list"
          >
            Create Your First List
          </button>
        </div>
      </div>
    );
  }

  if (!currentBucketId) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <BucketList />
      <main
        className="flex-1 flex flex-col overflow-hidden"
        role="main"
        aria-label="Task list area"
      >
        <TaskList bucketId={currentBucketId} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BucketProvider>
      <AppContent />
    </BucketProvider>
  );
}
