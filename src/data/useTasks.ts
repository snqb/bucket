import produce from "immer";
import create from "zustand";
import { persist } from "zustand/middleware";
import * as R from "ramda";

type Title = {
  text: string;
  emoji: string;
};

export type ITask = {
  id: string;
  title: Title;
  createdAt: Date;
};

type ITaskId = ITask["id"];

interface TasksState {
  tasks: ITask[];
  today: ITaskId[];
  rejected: ITaskId[];
  addTask: (task: ITask) => void;
  moveToBucketFromToday: (task: ITask) => void;
  rejectTask: (taskId: ITaskId) => void;
  moveToToday: (task: ITask) => void;
}

const useStore = create<TasksState, any>(
  persist(
    (set) => ({
      tasks: [],
      today: [],
      rejected: [],
      moveToToday: (task) => {
        set(
          produce((draft) => {
            draft.today.push(task.id);
          })
        );
      },
      moveToBucketFromToday: (task) => {
        set(
          produce((draft) => {
            draft.today = R.without([task.id], draft.today);
          })
        );
      },
      addTask: (task) =>
        set(
          produce((draft) => {
            draft.tasks.push(task);
          })
        ),
      rejectTask: (taskId) => {
        set(
          produce((draft) => {
            draft.rejected.push(taskId);
          })
        );
      },
    }),
    {
      name: "tasks",
      getStorage: () => localStorage,
    }
  )
);

export const useTasks = () => {
  const {
    tasks,
    addTask,
    rejectTask,
    today,
    rejected,
    moveToToday,
    moveToBucketFromToday,
  } = useStore();

  const todaySet = new Set(today);
  const rejectedSet = new Set(rejected);

  const hasInToday = (task: ITask) => todaySet.has(task.id);
  const hasInRejected = (task: ITask) => rejectedSet.has(task.id);

  const todayTasks = R.pipe(
    R.filter(hasInToday),
    R.reject(hasInRejected)
  )(tasks);

  const rejectedTasks = R.filter(hasInRejected)(tasks);
  const bucketTasks = R.pipe(
    R.reject(hasInToday),
    R.reject(hasInRejected)
  )(tasks);

  return {
    bucket: bucketTasks,
    today: todayTasks,
    rejected: rejectedTasks,
    addTask,
    rejectTask,
    moveToToday,
    moveToBucketFromToday,
  };
};
