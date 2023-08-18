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

export type TodoState = Record<typeof PERIODS[number], Todo[]>;
export const initialState: TodoState = PERIODS.reduce(
	(acc, it) => ({ ...acc, [it]: [] }),
	{} as TodoState,
);
const todoSlice = createSlice({
	name: "todo",
	initialState,
	reducers: {
		addTask: (
			state,
			action: PayloadAction<{ key: keyof TodoState; task: Todo }>,
		) => {
			state[action.payload.key].unshift(action.payload.task);
		},
		removeTask: (
			state,
			action: PayloadAction<{ key: keyof TodoState; id: string }>,
		) => {
			state[action.payload.key] = state[action.payload.key].filter(
				(task) => task.id !== action.payload.id,
			);
		},
		moveTask: (
			state,
			action: PayloadAction<{
				from: keyof TodoState;
				to: keyof TodoState;
				id: string;
			}>,
		) => {
			const taskIndex = state[action.payload.from].findIndex(
				(task) => task.id === action.payload.id,
			);
			if (taskIndex > -1) {
				const [task] = state[action.payload.from].splice(taskIndex, 1);
				state[action.payload.to].push(task);
			}
		},
		toToday: (
			state,
			action: PayloadAction<{ from: keyof TodoState; id: string }>,
		) => {
			const taskIndex = state[action.payload.from].findIndex(
				(task) => task.id === action.payload.id,
			);
			if (taskIndex > -1) {
				const [task] = state[action.payload.from].splice(taskIndex, 1);
				state.today.push(task);
			}
		},
	},
});

export const { addTask, removeTask, moveTask, toToday } = todoSlice.actions;

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
