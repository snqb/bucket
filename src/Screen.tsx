import { Task } from "./Task";

import { observable } from "@legendapp/state";
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  useInView,
} from "framer-motion";
import randomColor from "randomcolor";
import { memo, useEffect, useMemo, useRef } from "react";
import Adder from "./Adder";
import { $currentScreen, level$ } from "./App";
import { Button } from "./components/ui/button";
import { getRandomEmoji } from "./emojis";
import {
  removeScreen,
  renameScreen,
  useAppDispatch,
  useAppSelector,
} from "./store";

type Props = HTMLMotionProps<"div"> & {
  name: string;
  x: number;
  y: number;
};

const getBg = (name: string, alpha = 0.07) => {
  return randomColor({
    luminosity: "dark",
    hue: "random",
    seed: name,
    format: "hsla",
    alpha,
  });
};

export const preventDrag$ = observable(false);

const Screen = ({ name, x, y, ...divProps }: Props) => {
  const tasks = useAppSelector((state) => state.todo.values);
  const dispatch = useAppDispatch();
  const ref = useRef<Element>(document.querySelector("#screens")!);

  const isInView = useInView(ref, {
    amount: 0.8,
  });

  const level = level$.get();

  useEffect(() => {
    if (isInView && level === 2) {
      $currentScreen.set(name);
    }
  }, [isInView, name]);

  const todos = tasks[name] ?? [];

  const bg = useMemo(() => getBg(name, 0.8), [name, level]);
  if (todos === undefined) return null;

  const opacity = level === 1 && todos.length === 0 ? "opacity-0" : "";
  const border = level === 1 ? "border border-gray-400" : "";

  return (
    <motion.div
      className={`flex h-full flex-col ${opacity} min-w-[${todos.length > 0 ? 42 : 21}ch] items-stretch gap-3 overflow-hidden px-5 py-4 ${border} bg-opacity-75`}
      style={{
        background: bg,
      }}
      ref={ref as any}
      transition={{
        type: "spring",
        duration: 0.2,
      }}
      initial={{ left: "-100%" }}
      exit={{ left: "100%" }}
      animate={{
        left: 0,
      }}
      {...divProps}
    >
      <div className="max-w-screen flex justify-between">
        <div className={`flex saturate-0 opacity-${level === 1 ? 50 : 100}`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              // dispatch(removeScreen({ coords: [y, x] }));
            }}
          >
            🗑️
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newName = prompt(`${name} -> to what?`);
              if (newName && !tasks[newName]) {
                dispatch(renameScreen({ coords: [y, x], newName }));
              }
            }}
          >
            ✏️
          </Button>
        </div>
        <h2 className="font-bold mb-2 whitespace-nowrap text-2xl">
          {getRandomEmoji(name)}
          {name}
        </h2>
      </div>

      <hr className="border-gray-500" />

      <div className="flex flex-col items-stretch gap-2">
        {level === 2 && <Adder where={name} />}
        <AnimatePresence initial={false}>
          {todos.map((task, index) => (
            <Task
              initial={{ transform: "translateY(-100%)" }}
              animate={{
                transform: "translateY(0)",
              }}
              exit={{
                opacity: 0,
              }}
              key={task.id + index}
              task={task}
              where={name}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default memo(Screen);
