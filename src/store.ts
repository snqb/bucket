import Dexie, { Table } from "dexie";
import dexieCloud from "dexie-cloud-addon";

export interface TodoList {
  id?: number;
  title: string;
}

export interface TodoItem {
  id?: number;
  title: string;
  progress: number;
  description?: string;
  todoListId: number;
}


export class TodoDB extends Dexie {
  todoLists!: Table<TodoList, number>;
  todoItems!: Table<TodoItem, number>;
  constructor() {
    super("TodoDB", { addons: [dexieCloud] });
    this.version(1).stores({
      todoLists: "@id",
      todoItems: "@id, todoListId",
    });
  }

  deleteList(todoListId: number) {
    return this.transaction("rw", this.todoItems, this.todoLists, () => {
      this.todoItems.where({ todoListId }).delete();
      this.todoLists.delete(todoListId);
    });
  }
}
export const bucketDB = new TodoDB();

bucketDB.cloud.configure({
  databaseUrl: "https://zrse37s6n.dexie.cloud",
  requireAuth: true
});

