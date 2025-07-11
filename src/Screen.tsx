import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";
import randomColor from "randomcolor";
import { memo, useMemo, useRef } from "react";
import Adder from "./Adder";
import { useListTasks } from "./tinybase-hooks";
import { Task } from "./Task";

type Props = HTMLMotionProps<"div"> & {
  list: any;
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

const Screen = ({ list, ...divProps }: Props) => {
  const todos = useListTasks(String(list.id));

  const ref = useRef<Element>(document.querySelector("#screens")!);
  const bg = useMemo(() => getBg(list.title, 0.1), [list.title]);

  if (!todos) return null;

  return (
    <motion.div
      className={`m-2 flex flex-col items-stretch gap-3 overflow-hidden border border-gray-600 bg-opacity-15 px-5 pb-9 pt-6 md:h-full md:max-h-96`}
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
      {/* Header with title and emoji - only on desktop */}
      <div className="mb-4 hidden items-center gap-2 border-b border-gray-500 pb-2 md:flex">
        <span className="text-2xl">{list.emoji}</span>
        <h2 className="font-semibold truncate text-lg text-white">
          {list.title}
        </h2>
      </div>

      <div className="flex flex-col items-stretch gap-2 overflow-y-auto">
        <AnimatePresence initial={false}>
          {todos.map((task) => (
            <Task
              key={String(task.id)}
              initial={{ transform: "translateY(-100%)" }}
              animate={{
                transform: "translateY(0)",
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                type: "spring",
                damping: 200,
                stiffness: 200,
                duration: 0.8,
              }}
              task={task}
            />
          ))}
        </AnimatePresence>
        <Adder where={list} className="mb-2" />
      </div>
    </motion.div>
  );
};

export default memo(Screen);
