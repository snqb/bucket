import * as R from "ramda";
import create, { GetState, SetState } from "zustand";
import { persist } from "zustand/middleware";

type Title = {
  text: string;
  emoji: string;
};

type TaskTravelDestination = "bucket" | "graveyard" | "today";

export type ITask = {
  id: string;
  title: Title;
  createdAt: Date;
  progress: number;
  wasSentTo: TaskTravelDestination;
  description?: string;
};

interface State {
  tasks: Record<ITask["id"], ITask>;
  addTask: (task: ITask) => void;
  todayIt: (task: ITask) => void;
  untodayIt: (task: ITask) => void;
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
    todayIt: R.pipe(sendTaskTo("today"), set),
    untodayIt: R.pipe(sendTaskTo("bucket"), set),
    killIt: R.pipe(sendTaskTo("graveyard"), set),
    describe: (task: ITask, description: string) =>
      R.set<State, string>(
        lensTaskProp(task, "description"),
        description,
        state()
      ),
  };
};

const useStore = create<State>(
  // @ts-ignore dunno what's going on, don't wanna be spending time on that too
  persist(reducer, {
    name: "bucket",
    version: 2,
  })
);

export const useTasks = () => {
  const {
    tasks: tasksAsObject,
    todayIt: moveToToday,
    save: saveProgress,
    untodayIt,
    ...rest
  } = useStore();

  const tasks = R.values(tasksAsObject);

  const graveyard = R.filter(R.propEq("wasSentTo", "graveyard"), tasks);
  const today = R.filter(R.propEq("wasSentTo", "today"), tasks);
  const bucket = R.filter(R.propEq("wasSentTo", "bucket"), tasks);

  const isToday = (task: ITask) => R.propEq("wasSentTo", "today", task);

  return {
    bucket,
    today,
    graveyard,
    moveToToday,
    moveToBucketFromToday: untodayIt,
    isToday,
    saveProgress,
    ...rest,
  };
};

// <Flex justify="flex-end">
//   <Button
//     onClick={() => rejectTask(task)}
//     variant="outline"
//     colorScheme="pink"
//   >
//     🔪{"  "}f* it!
//   </Button>
// </Flex>
