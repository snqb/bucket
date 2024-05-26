import { PayloadAction, configureStore, createSlice } from "@reduxjs/toolkit";
import { clamp, clone } from "ramda";
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

const initialState: {
  structure: string[][];
  values: { [key: string]: Todo[] };
} = {
  structure: [
    ["Today", "Later"],
    ["Work", "Family"],
  ],
  values: {},
};

const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    addTask: (
      state,
      action: PayloadAction<{
        key: string;
        task: Todo;
      }>,
    ) => {
      const { key } = action.payload;

      const [row, column] = state.structure.reduce(
        (acc, row, rowIndex) => {
          const columnIndex = row.indexOf(key);
          if (columnIndex > -1) {
            acc = [rowIndex, columnIndex];
          }
          return acc;
        },
        [-1, -1],
      );

      if (!state.structure[row] || !state.structure[row][column]) {
        state.structure[row] = [];
        state.structure[row][column] = key;
      }
      if (!state.values[key]) {
        state.values[key] = [];
      }

      state.values[key].unshift(action.payload.task);
    },
    addScreen: (
      { structure, values },
      { payload }: PayloadAction<{ title: string; x?: number; y?: number }>,
    ) => {
      let x, y;
      const width = structure.reduce(
        (acc, row) => Math.max(acc, row.length),
        0,
      );
      const height = structure.length;

      console.log(width, height);
      if (height > width) {
        y = width + 1;
        x = height;
      } else if (height === width) {
        y = width + 1;
        x = 0;
      } else {
        y = width;
        x = height + 1;
      }

      const { title } = payload;

      // Bounds Checking
      if (y < 0 || x < 0) {
        console.error("Coordinates out of bounds");
        return;
      }

      if (y >= structure.length) {
        for (let i = structure.length; i <= y; i++) {
          structure.push([]);
        }
      }

      const isAddingOnEmpty = !(structure[y] && structure[y][x]);

      if (isAddingOnEmpty) {
        const position = clamp(0, structure[y].length, x);
        structure[y][position] = title;
      } else {
        structure[y].splice(x, 0, title);
      }
      Object.assign(values, { [title]: [] });
    },
    removeTask: (state, action: PayloadAction<{ key: string; id: string }>) => {
      state.values[action.payload.key] = state.values[
        action.payload.key
      ].filter((task) => task.id !== action.payload.id);
    },
    updateProgress: function (
      state,
      {
        payload: { key, id, progress },
      }: PayloadAction<{ key: string; id: string; progress: number }>,
    ) {
      const value = state.values[key].find((task) => task.id === id);
      if (value) value.progress = progress;
    },
    updateDescription: function (
      state,
      {
        payload: { key, id, text },
      }: PayloadAction<{ key: string; id: string; text: string }>,
    ) {
      const value = state.values[key].find((task) => task.id === id);
      if (value) value.description = text;
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
      { values, structure },
      action: PayloadAction<{ newName: string; coords: [number, number] }>,
    ) => {
      const { newName, coords } = action.payload;
      const [row, column] = coords;

      const oldName = structure[row][column];
      values[newName] = clone(values[oldName]);
      delete values[oldName];

      structure[row][column] = newName;
    },
    removeScreen: (
      state,
      action: PayloadAction<{ coords: [number, number] }>,
    ) => {
      const { coords } = action.payload;
      const [row, column] = coords;
      const title = state.structure[row][column];

      delete state.values[title];
      state.structure[row].splice(column, 1);
      if (state.structure[row].length === 0) {
        state.structure.splice(row, 1);
      }
    },
  },
});

export const {
  addTask,
  removeTask,
  moveTask,
  renameScreen,
  removeScreen,
  updateProgress,
  addScreen,
  updateDescription,
} = todoSlice.actions;

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
