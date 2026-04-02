import * as E from "@evolu/common";
import type { Schema } from "./schema.js";

type Evolu = E.Evolu<Schema>;

/** All lists, ordered by position then createdAt */
export const listsQuery = (evolu: Evolu) =>
  evolu.createQuery((db) =>
    db
      .selectFrom("list")
      .select(["id", "title", "emoji", "position", "createdAt"])
      .where("isDeleted", "is not", E.sqliteTrue)
      .where("title", "is not", null)
      .$narrowType<{ title: E.kysely.NotNull }>()
      .orderBy("position")
      .orderBy("createdAt"),
  );

/** All tasks across all lists */
export const allTasksQuery = (evolu: Evolu) =>
  evolu.createQuery((db) =>
    db
      .selectFrom("task")
      .select([
        "id",
        "listId",
        "title",
        "description",
        "progress",
        "dueDate",
        "position",
        "createdAt",
      ])
      .where("isDeleted", "is not", E.sqliteTrue)
      .where("title", "is not", null)
      .$narrowType<{ title: E.kysely.NotNull }>()
      .orderBy("position")
      .orderBy("createdAt"),
  );
