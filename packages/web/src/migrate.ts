import type * as E from "@evolu/common";
import type { Schema } from "@bucket/core";

type Evolu = E.Evolu<Schema>;

interface V1List {
  id: string;
  title: string;
  emoji?: string;
  createdAt: number;
}

interface V1Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  progress: number;
  dueDate?: string;
  createdAt: number;
}

interface V1Room {
  lists: V1List[];
  tasks: V1Task[];
}

/**
 * Migrate data from v1 Bucket (Yjs REST API) into v2 (Evolu).
 * Returns { lists, tasks } counts on success.
 */
export async function migrateFromV1(
  evolu: Evolu,
  apiUrl: string,
  roomId: string,
): Promise<{ lists: number; tasks: number }> {
  const res = await fetch(`${apiUrl}/room/${roomId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data: V1Room = await res.json();

  // Map old list IDs → new Evolu list IDs
  const listIdMap = new Map<string, string>();

  // Insert lists
  for (const list of data.lists) {
    const result = evolu.insert("list", {
      title: list.title,
      emoji: list.emoji || null,
    } as any);
    if (result.ok) {
      listIdMap.set(list.id, result.value.id);
    }
  }

  // Insert tasks
  let taskCount = 0;
  for (const task of data.tasks) {
    const newListId = listIdMap.get(task.listId);
    if (!newListId) continue; // orphan task, skip

    const result = evolu.insert("task", {
      listId: newListId,
      title: task.title,
      description: task.description || null,
      progress: Math.min(99, Math.max(0, task.progress)) as any, // clamp, 100 = deleted in v1
      dueDate: task.dueDate || null,
    } as any);
    if (result.ok) taskCount++;
  }

  return { lists: listIdMap.size, tasks: taskCount };
}
