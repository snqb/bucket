/* @ts-ignore-file */
import * as R from "ramda";
import create, { GetState, SetState } from "zustand";
import { persist } from "zustand/middleware";

type Title = {
  text: string;
  emoji: string;
};

type TaskTravelDestination = "bucket" | "graveyard" | "today" | "shuffle";

export type ITask = {
  id: string;
  title: Title;
  createdAt: Date;
  killedAt?: Date;
  progress: number;
  wasSentTo: TaskTravelDestination;
  description?: string;
};

interface State {
  tasks: Record<ITask["id"], ITask>;

  shuffle: ITask[];
  shuffleIt: (slotIndex: number) => void;

  addTask: (task: ITask) => void;
  todayIt: (task: ITask) => void;
  bucketIt: (task: ITask) => void;
  killIt: (task: ITask) => void;
  save: (task: ITask, progress: number) => void;
  describe: (task: ITask, description: string) => void;
}

const reducer = (set: SetState<State>, state: GetState<State>) => {
  const lensTaskProp = R.curry((task: ITask, prop: keyof ITask) =>
    R.lensPath(["tasks", task.id, prop])
  );

  const sendTaskTo = R.curry(
    (destination: TaskTravelDestination, task: ITask) =>
      R.set<State, TaskTravelDestination>(
        lensTaskProp(task)("wasSentTo"),
        destination,
        state()
      )
  );

  return {
    tasks: {},
    shuffle: [],
    addTask: R.pipe(
      (task: ITask) =>
        R.set<State, ITask>(R.lensPath(["tasks", task.id]), task, state()),
      set
    ),
    save: R.pipe(
      (task: ITask, progress: number) =>
        R.set<State, number>(lensTaskProp(task, "progress"), progress, state()),
      set
    ),
    shuffleIt: (slot: number) => {
      const possibleItems = R.reject(
        R.propEq("wasSentTo", "graveyard"),
        R.difference(R.values(state().tasks), state().shuffle)
      );

      const random =
        possibleItems[Math.floor(possibleItems.length * Math.random())];

      set(R.set(R.lensPath(["shuffle", slot]), random));
    },
    todayIt: R.pipe(sendTaskTo("today"), set),
    bucketIt: R.pipe(sendTaskTo("bucket"), set),
    killIt: R.pipe(sendTaskTo("graveyard"), set),
    describe: R.pipe(
      (task: ITask, description: string) =>
        R.set<State, string>(
          lensTaskProp(task, "description"),
          description,
          state()
        ),
      set
    ),
  };
};

const useStore = create<State>(
  // @ts-ignore dunno what's going on, don't wanna be spending time on that too
  persist(reducer, {
    name: "bucket",
    version: 2,
    // @ts-ignore
    getStorage: () => localStorage,
  })
);

export const useTasks = () => {
  const {
    tasks: tasksAsObject,
    todayIt: moveToToday,
    save: saveProgress,
    bucketIt,
    killIt,
    shuffle,
    ...rest
  } = useStore();

  const tasks = R.values(tasksAsObject);

  const graveyard = R.compose(
    // @ts-ignore
    R.reverse<ITask>,
    R.sortBy<ITask>(R.prop("createdAt")),
    R.filter(R.propEq("wasSentTo", "graveyard"))
  )(tasks);

  const today = R.filter(R.propEq("wasSentTo", "today"), tasks);
  const bucket = R.reject(R.propEq("wasSentTo", "graveyard"), tasks);

  const isToday = (task: ITask) => R.propEq("wasSentTo", "today", task);
  const killAndWrite = (task: ITask) => {
    const inShuffle = R.findIndex(R.propEq("id", task.id), shuffle);
    rest.shuffleIt(inShuffle);
    return killIt(R.assoc("killedAt", new Date(), task));
  };

  return {
    tasks,
    bucket,
    today,
    graveyard,
    shuffle,
    moveToToday,
    bucketIt,
    isToday,
    saveProgress,
    killIt: killAndWrite,
    ...rest,
  };
};

function sampleSize<T>(size: number, list: T[], collected: T[] = []): T[] {
  return size < 1 || list.length < 1
    ? collected
    : size >= list.length
    ? [...collected, ...list] // or throw error?
    : Math.random() < size / list.length
    ? sampleSize(size - 1, list.slice(1), [...collected, list[0]])
    : sampleSize(size, list.slice(1), collected);
}
