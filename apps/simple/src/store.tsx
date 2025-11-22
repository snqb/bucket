import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Task {
  id: string;
  text: string;
  progress: number;
  createdAt: number;
}

interface Bucket {
  id: string;
  name: string;
  tasks: Task[];
}

interface BucketState {
  buckets: Bucket[];
  currentBucketId: string | null;
}

interface BucketContextType extends BucketState {
  addBucket: (name: string) => void;
  deleteBucket: (id: string) => void;
  setCurrentBucket: (id: string) => void;
  addTask: (bucketId: string, text: string) => void;
  updateTaskProgress: (bucketId: string, taskId: string, progress: number) => void;
  deleteTask: (bucketId: string, taskId: string) => void;
}

const BucketContext = createContext<BucketContextType | null>(null);

const STORAGE_KEY = 'bucket-simple-data';

function loadFromStorage(): BucketState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load from storage:', error);
  }

  // First-time user: create onboarding bucket with a welcome task
  const onboardingBucket: Bucket = {
    id: Date.now().toString(),
    name: 'Getting Started',
    tasks: [
      {
        id: (Date.now() + 1).toString(),
        text: 'Look around and explore the app',
        progress: 0,
        createdAt: Date.now(),
      },
    ],
  };

  return {
    buckets: [onboardingBucket],
    currentBucketId: onboardingBucket.id,
  };
}

function saveToStorage(state: BucketState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

export function BucketProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BucketState>(loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addBucket = (name: string) => {
    const newBucket: Bucket = {
      id: Date.now().toString(),
      name,
      tasks: [],
    };
    setState(prev => ({
      buckets: [...prev.buckets, newBucket],
      currentBucketId: newBucket.id,
    }));
  };

  const deleteBucket = (id: string) => {
    setState(prev => {
      const newBuckets = prev.buckets.filter(b => b.id !== id);
      return {
        buckets: newBuckets,
        currentBucketId: prev.currentBucketId === id
          ? (newBuckets[0]?.id || null)
          : prev.currentBucketId,
      };
    });
  };

  const setCurrentBucket = (id: string) => {
    setState(prev => ({ ...prev, currentBucketId: id }));
  };

  const addTask = (bucketId: string, text: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      progress: 0,
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      buckets: prev.buckets.map(bucket =>
        bucket.id === bucketId
          ? { ...bucket, tasks: [...bucket.tasks, newTask] }
          : bucket
      ),
    }));
  };

  const updateTaskProgress = (bucketId: string, taskId: string, progress: number) => {
    setState(prev => ({
      ...prev,
      buckets: prev.buckets.map(bucket =>
        bucket.id === bucketId
          ? {
              ...bucket,
              tasks: bucket.tasks.map(task =>
                task.id === taskId ? { ...task, progress } : task
              ),
            }
          : bucket
      ),
    }));
  };

  const deleteTask = (bucketId: string, taskId: string) => {
    setState(prev => ({
      ...prev,
      buckets: prev.buckets.map(bucket =>
        bucket.id === bucketId
          ? { ...bucket, tasks: bucket.tasks.filter(t => t.id !== taskId) }
          : bucket
      ),
    }));
  };

  return (
    <BucketContext.Provider
      value={{
        ...state,
        addBucket,
        deleteBucket,
        setCurrentBucket,
        addTask,
        updateTaskProgress,
        deleteTask,
      }}
    >
      {children}
    </BucketContext.Provider>
  );
}

export function useBucket() {
  const context = useContext(BucketContext);
  if (!context) {
    throw new Error('useBucket must be used within BucketProvider');
  }
  return context;
}
