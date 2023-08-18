import { TodoState } from "./store";

export const PERIODS = [
  "today",
  "tomorrow",
  "someday",
  "thisWeek",
  "nextWeek",
  "someWeek",
  "otherThing",
  "anotherThing",
  "differentThing",
] as const;

export type Period = (typeof PERIODS)[number];

export const PERIOD_TEXTS: Record<keyof TodoState, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  someday: "Someday",
  thisWeek: "This week",
  nextWeek: "Next week",
  someWeek: "Some week",
  otherThing: "Other thing",
  anotherThing: "Another thing",
  differentThing: "Different thing",
};
