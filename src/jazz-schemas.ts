import { co, z } from "jazz-tools";

// TodoList schema
export const TodoList = co.map({
  title: z.string(),
  emoji: z.optional(z.string()),
});

export type TodoList = co.loaded<typeof TodoList>;

// TodoItem schema
export const TodoItem = co.map({
  title: z.string(),
  progress: z.number().min(0).max(100).default(0),
  description: z.optional(z.string()),
  todoListId: z.string(),
});

export type TodoItem = co.loaded<typeof TodoItem>;

// Cemetery schema for deleted items
export const CemeteryItem = co.map({
  title: z.string(),
  progress: z.number().min(0).max(100).default(0),
  description: z.optional(z.string()),
  todoListId: z.optional(z.string()),
  deletedAt: z.date().default(() => new Date()),
});

export type CemeteryItem = co.loaded<typeof CemeteryItem>;

// Collections
export const TodoListCollection = co.list(TodoList);
export const TodoItemCollection = co.list(TodoItem);
export const CemeteryCollection = co.list(CemeteryItem);

// Account root schema
export const AccountRoot = co.map({
  todoLists: TodoListCollection,
  todoItems: TodoItemCollection,
  cemetery: CemeteryCollection,
});

export type AccountRoot = co.loaded<typeof AccountRoot>;

// Profile schema
export const Profile = co.map({
  name: z.string(),
});

export type Profile = co.loaded<typeof Profile>;

// Account schema with auto-initialization
export const Account = co
  .account({
    root: AccountRoot,
    profile: Profile,
  })
  .withMigration((account) => {
    if (!account.root) {
      console.log("🔧 Auto-initializing account root");
      account.root = AccountRoot.create({
        todoLists: TodoListCollection.create([]),
        todoItems: TodoItemCollection.create([]),
        cemetery: CemeteryCollection.create([]),
      });
      console.log("✅ Account root initialized with migration");
    }
  });

export type Account = co.loaded<typeof Account>;

// Initialize account root helper (no groups needed)
export function initializeAccountRoot(): co.loaded<typeof AccountRoot> {
  return AccountRoot.create({
    todoLists: TodoListCollection.create([]),
    todoItems: TodoItemCollection.create([]),
    cemetery: CemeteryCollection.create([]),
  });
}
