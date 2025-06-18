import { DataRegistry, itemPathGetPart } from "@goatdb/goatdb";

// Todo List Schema - matches existing TodoList interface
export const kSchemaTodoList = {
  ns: "todolist",
  version: 1,
  fields: {
    title: {
      type: "string",
      required: true,
    },
    emoji: {
      type: "string",
      required: false,
    },
    createdAt: {
      type: "date",
      default: () => new Date(),
    },
  },
} as const;

// Todo Item Schema - matches existing TodoItem interface
export const kSchemaTodoItem = {
  ns: "todoitem",
  version: 1,
  fields: {
    title: {
      type: "string",
      required: true,
    },
    progress: {
      type: "number",
      default: () => 0,
      validate: (data: any) => {
        const value = data.progress || 0;
        return value >= 0 && value <= 100;
      },
    },
    description: {
      type: "string",
      required: false,
    },
    todoListId: {
      type: "string", // GoatDB uses string IDs
      required: true,
    },
    createdAt: {
      type: "date",
      default: () => new Date(),
    },
  },
} as const;

// Cemetery Schema - matches existing cemetery structure
export const kSchemaCemetery = {
  ns: "cemetery",
  version: 1,
  fields: {
    title: {
      type: "string",
      required: true,
    },
    progress: {
      type: "number",
      default: () => 0,
    },
    description: {
      type: "string",
      required: false,
    },
    todoListId: {
      type: "string",
      required: false,
    },
    deletedAt: {
      type: "date",
      default: () => new Date(),
    },
  },
} as const;

// Type exports for compatibility
export type TodoListSchema = typeof kSchemaTodoList;
export type TodoItemSchema = typeof kSchemaTodoItem;
export type CemeterySchema = typeof kSchemaCemetery;

// Registry setup function
export function registerSchemas(
  registry: DataRegistry = DataRegistry.default,
): void {
  // Register all schemas
  registry.registerSchema(kSchemaTodoList);
  registry.registerSchema(kSchemaTodoItem);
  registry.registerSchema(kSchemaCemetery);

  // Authorization rules - each user can only access their own data
  registry.registerAuthRule(/\/data\/\w+/, ({ repoPath, session }) => {
    const repoOwner = itemPathGetPart(repoPath, "repo");
    return repoOwner === session.owner;
  });

  // Auto-complete logic can be handled at the component level
}
