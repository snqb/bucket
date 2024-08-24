import { Task } from "./Task";
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";
import randomColor from "randomcolor";
import { memo, useMemo, useRef } from "react";
import Adder from "./Adder";
import { Button } from "./components/ui/button";
import { getRandomEmoji } from "./emojis";
import { TodoList, bucketDB } from "./store";
import { useLiveQuery } from "dexie-react-hooks";

type Props = HTMLMotionProps<"div"> & {
  list: TodoList;
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
  const todos = useLiveQuery(
    () => bucketDB.todoItems.where({ todoListId: list.id }).toArray(),
    [list.id],
  );

  const ref = useRef<Element>(document.querySelector("#screens")!);
  const bg = useMemo(() => getBg(list.title, 0.1), [list.title]);

  if (todos === undefined) return null;

  return (
    <motion.div
      className={`m-2 flex  flex-col items-stretch gap-3 overflow-hidden border border-gray-600 bg-opacity-15 px-5 pb-9 pt-6`}
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
      <div className={`flex saturate-0`} id={`screen-${list.id}`}>
        <div className="">
          <h2 className="font-bold mb-2 whitespace-nowrap text-2xl">
            {getRandomEmoji(list.title)}
            {list.title}
          </h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            const confirm = window.confirm(`Delete ${list.title}?`);
            if (confirm) {
              bucketDB.todoLists.delete(list.id!);
            }
          }}
        >
          🗑️
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();

            const newName = prompt(`${name} -> to what?`);
            if (newName) {
              bucketDB.todoLists.update(list.id!, { title: newName });
            }
          }}
        >
          ✏️
        </Button>
      </div>

      <hr className="border-gray-500" />

      <div className="flex flex-col items-stretch gap-2">

        <Adder where={list} className="mb-2" />
        <AnimatePresence initial={false}>
          {todos.map((task) => (
            <Task
              key={task.id}
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
      </div>
    </motion.div>
  );
};

export default memo(Screen);
