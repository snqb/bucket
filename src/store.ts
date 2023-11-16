import { PERIODS } from "./constants";
import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import thunk from "redux-thunk";

export type Todo = {
  id: string;
  title: Title;
  createdAt: Date;
  progress: number;
  description?: string;
  subtasks?: Todo[];
};

type Title = {
  text: string;
  emoji: string;
};

export type TodoState = Record<string, Todo[]>;
export const initialState: TodoState = PERIODS.reduce(
  (acc, it) => ({ ...acc, [it]: [] }),
  {} as TodoState,
);

const isT: {
  structure: string[][];
  values: { [key: string]: Todo[] };
} = {
  structure: [["welcome"]],
  values: {},
};

const todoSlice = createSlice({
  name: "todo",
  initialState: isT,
  reducers: {
    addTask: (
      state,
      action: PayloadAction<{
        key: string;
        task: Todo;
        coords: [number, number];
      }>,
    ) => {
      const { key, coords } = action.payload;
      const [row, column] = coords;

      if (!state.structure[row] || !state.structure[row][column]) {
        state.structure[row] = [];
        state.structure[row][column] = key;
      }
      if (!state.values[key]) {
        state.values[key] = [];
      }

      state.values[key].unshift(action.payload.task);
    },
    removeTask: (state, action: PayloadAction<{ key: string; id: string }>) => {
      state.values[action.payload.key] = state.values[
        action.payload.key
      ].filter((task) => task.id !== action.payload.id);
    },
    moveTask: (
      state,
      action: PayloadAction<{
        from: string;
        to: string;
        id: string;
      }>,
    ) => {
      const taskIndex = state.values[action.payload.from].findIndex(
        (task) => task.id === action.payload.id,
      );
      if (taskIndex > -1) {
        const [task] = state.values[action.payload.from].splice(taskIndex, 1);
        state.values[action.payload.to].push(task);
      }
    },
    renameScreen: (
      state,
      action: PayloadAction<{ title: string; coords: [number, number] }>,
    ) => {
      const { title, coords } = action.payload;
      const [row, column] = coords;

      const oldName = state.structure?.[row]?.[column];
      if (oldName) {
        state.values[title] = [...state.values[oldName]];
        delete state.values[oldName];
      } else {
        state.values[title] = [];
      }

      if (!state.structure[row]) {
        state.structure[row] = [];
      }
      state.structure[row][column] = title;
    },
    removeScreen: (
      state,
      action: PayloadAction<{ title: string; coords: [number, number] }>,
    ) => {
      const { title, coords } = action.payload;
      const [row, column] = coords;
      console.log(row, column);

      delete state.values[title];
      state.structure[row].splice(column, 1);
      if (state.structure[row].length === 0) {
        state.structure.splice(row, 1);
      }
    },
  },
});

export const { addTask, removeTask, moveTask, renameScreen, removeScreen } =
  todoSlice.actions;

const persistConfig = {
  key: "bucket",
  storage,
};

const persistedReducer = persistReducer(persistConfig, todoSlice.reducer);

export const store = configureStore({
  reducer: {
    todo: persistedReducer,
  },
  middleware: [thunk],
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
