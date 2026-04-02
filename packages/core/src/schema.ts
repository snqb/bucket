import * as E from "@evolu/common";

// Branded IDs — can't mix a ListId with a TaskId
export const ListId = E.id("List");
export type ListId = typeof ListId.Type;

export const TaskId = E.id("Task");
export type TaskId = typeof TaskId.Type;

// Progress: 0–100 stored as NonNegativeInt (validation in app layer)
export type Progress = typeof E.NonNegativeInt.Type;

export const Schema = {
  list: {
    id: ListId,
    title: E.NonEmptyString100,
    emoji: E.nullOr(E.String100),
    position: E.nullOr(E.Int), // for ordering
  },
  task: {
    id: TaskId,
    listId: ListId,
    title: E.NonEmptyString100,
    description: E.nullOr(E.String1000),
    progress: E.nullOr(E.NonNegativeInt),
    dueDate: E.nullOr(E.DateIso),
    position: E.nullOr(E.Int), // for ordering within list
  },
};

export type Schema = typeof Schema;
