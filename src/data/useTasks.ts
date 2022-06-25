import produce from "immer";
import create from "zustand";
import { persist } from "zustand/middleware";

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
  today: ITask[];
  rejected: ITask[];
  addTask: (task: ITask) => void;
  rejectTask: (taskId: ITaskId) => void;
  moveToToday: (task: ITask) => void;
}

const useStore = create<TasksState, any>(
  persist(
    (set, get) => ({
      tasks: [],
      today: [],
      rejected: [],
      moveToToday: (task) => {
        set(
          produce((draft) => {
            draft.tasks = draft.tasks.filter((t: ITask) => t.id !== task.id);
            draft.today.push(task);
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
        const tasks = get().tasks;
        const today = get().today;
        set(
          produce((draft) => {
            draft.rejected.push(today.find((it) => it.id === taskId));
            draft.today = today.filter((task) => task.id !== taskId);
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
  const { tasks, addTask, rejectTask, today, rejected, moveToToday } =
    useStore();

  return {
    bucket: tasks,
    today,
    addTask,
    rejectTask,
    rejected,
    moveToToday,
  };
};
