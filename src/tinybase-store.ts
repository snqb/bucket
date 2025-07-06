import { createStore, createIndexes, createRelationships } from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";

// Create the main store
export const store = createStore()
  .setTablesSchema({
    lists: {
      id: { type: "string" },
      title: { type: "string" },
      emoji: { type: "string", default: "📋" },
      color: { type: "string", default: "#3B82F6" },
      createdAt: { type: "number" },
    },
    tasks: {
      id: { type: "string" },
      listId: { type: "string" },
      title: { type: "string" },
      description: { type: "string", default: "" },
      progress: { type: "number", default: 0 },
      completed: { type: "boolean", default: false },
      createdAt: { type: "number" },
      updatedAt: { type: "number" },
    },
    cemetery: {
      id: { type: "string" },
      originalTitle: { type: "string" },
      originalDescription: { type: "string" },
      originalProgress: { type: "number" },
      deletedAt: { type: "number" },
      deletionReason: { type: "string", default: "deleted" },
    },
  })
  .setValuesSchema({
    lastSync: { type: "number", default: 0 },
    deviceId: { type: "string", default: "" },
  });

// Create indexes for better performance
export const indexes = createIndexes(store);
indexes.setIndexDefinition("tasksByList", "tasks", "listId");
indexes.setIndexDefinition("completedTasks", "tasks", "completed");

// Create relationships
export const relationships = createRelationships(store);
relationships.setRelationshipDefinition(
  "listTasks",
  "lists",
  "tasks",
  "listId",
);

// Set up persistence to localStorage
export const persister = createLocalPersister(store, "bucket-app");
persister.startAutoLoad();
persister.startAutoSave();

// Helper functions
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const createList = (title: string, emoji?: string, color?: string) => {
  const id = generateId();
  store.setRow("lists", id, {
    id,
    title,
    emoji: emoji || "📋",
    color: color || "#3B82F6",
    createdAt: Date.now(),
  });
  return id;
};

export const createTask = (
  listId: string,
  title: string,
  description?: string,
) => {
  const id = generateId();
  const now = Date.now();
  store.setRow("tasks", id, {
    id,
    listId,
    title,
    description: description || "",
    progress: 0,
    completed: false,
    createdAt: now,
    updatedAt: now,
  });
  return id;
};

export const updateTask = (
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    progress: number;
    completed: boolean;
  }>,
) => {
  const current = store.getRow("tasks", id);
  if (!current) return;

  store.setRow("tasks", id, {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteTask = (id: string, reason?: string) => {
  const task = store.getRow("tasks", id);
  if (!task) return;

  // Move to cemetery
  const cemeteryId = generateId();
  store.setRow("cemetery", cemeteryId, {
    id: cemeteryId,
    originalTitle: task.title as string,
    originalDescription: task.description as string,
    originalProgress: task.progress as number,
    deletedAt: Date.now(),
    deletionReason: reason || "deleted",
  });

  // Remove from tasks
  store.delRow("tasks", id);
};

export const deleteList = (id: string) => {
  // Delete all tasks in this list
  const tasks = store.getRowIds("tasks");
  tasks.forEach((taskId) => {
    const task = store.getRow("tasks", taskId);
    if (task?.listId === id) {
      deleteTask(taskId, "list deleted");
    }
  });

  // Delete the list
  store.delRow("lists", id);
};

export const getListTasks = (listId: string) => {
  return indexes.getSliceRowIds("tasksByList", listId);
};

export const getCompletedTasks = () => {
  return indexes.getSliceRowIds("completedTasks", true);
};

// Initialize device ID if not set
if (!store.getValue("deviceId")) {
  store.setValue("deviceId", generateId());
}
