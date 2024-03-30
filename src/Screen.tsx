import { Task } from "./Task";

import { observable } from "@legendapp/state";
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  useInView,
} from "framer-motion";
import randomColor from "randomcolor";
import { memo, useContext, useEffect, useMemo, useRef } from "react";
import Adder from "./Adder";
import { Button } from "./components/ui/button";
import { getRandomEmoji } from "./emojis";
import { renameScreen, useAppDispatch, useAppSelector } from "./store";
import { Pressable, SpaceContext } from "react-zoomable-ui";

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
  const { viewPort } = useContext(SpaceContext);

  const isInView = useInView(ref, {
    amount: 0.8,
  });

  const todos = tasks[name] ?? [];

  const bg = useMemo(() => getBg(name, 0.8), [name]);
  if (todos === undefined) return null;

  return (
    <motion.div
      className={`flex h-full flex-col  min-w-[${todos.length > 0 ? 42 : 21}ch] items-stretch gap-3 overflow-hidden border border-gray-600 bg-opacity-75 px-5 py-4`}
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
        <div className={`flex saturate-0`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
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
        <Pressable
          onTap={() => {
            const element = document.querySelector(
              `#screen-${name}`,
            ) as HTMLElement;
            if (viewPort) {
              console.log(element);
              viewPort?.camera.centerFitElementIntoView(element, undefined, {
                durationMilliseconds: 400,
              });
            }
          }}
        >
          <h2 className="font-bold mb-2 whitespace-nowrap text-2xl">
            {getRandomEmoji(name)}
            {name}
          </h2>
        </Pressable>
      </div>

      <hr className="border-gray-500" />

      <div className="flex flex-col items-stretch gap-2">
        <Adder where={name} />
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
