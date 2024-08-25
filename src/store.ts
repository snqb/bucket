import Dexie, { Table } from "dexie";
import dexieCloud from "dexie-cloud-addon";
import * as R from "ramda";

export interface TodoList {
  id?: number;
  title: string;
  emoji?: string;
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
  cemetery!: Table<TodoItem, number>;

  constructor() {
    super("TodoDB", { addons: [dexieCloud] });
    this.version(2).stores({
      todoLists: "@id",
      todoItems: "@id, todoListId",
      cemetery: "@cemeteryId",
    });
  }

  deleteTodo(todo: TodoItem) {
    return this.transaction("rw", this.todoItems, this.todoLists, this.cemetery, () => {
      const clone = R.clone(R.omit(["id"], todo));
      this.cemetery.put(clone);
      // const 
      this.todoItems.delete(todo.id);
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
  requireAuth: true,
});
