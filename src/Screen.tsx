import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";
import randomColor from "randomcolor";
import { memo, useEffect, useMemo, useRef } from "react";
import Adder from "./Adder";
import { Button } from "./components/ui/button";
import { randomEmoji } from "./emojis";
import { TodoList } from "./jazz-schemas";
import { useJazzTodoItemsWhere, useJazzActions } from "./jazz-store";
import { Task } from "./Task";

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
  const todos = useJazzTodoItemsWhere({ todoListId: list.id! });
  const actions = useJazzActions();

  const ref = useRef<Element>(document.querySelector("#screens")!);
  const bg = useMemo(() => getBg(list.title, 0.1), [list.title]);

  if (!todos) return null;

  const handleUpdateEmoji = () => {
    const newEmoji = randomEmoji();
    actions.updateTodoList(list.id!, { emoji: newEmoji });
  };

  const handleUpdateTitle = () => {
    const newName = prompt(`${list.title} -> to what?`);
    if (newName) {
      actions.updateTodoList(list.id!, { title: newName });
    }
  };

  const handleDeleteList = () => {
    const confirm = window.confirm(`Delete ${list.title}?`);
    if (confirm) {
      actions.deleteList(list.id!);
    }
  };

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
      <div className={`flex`} id={`screen-${list.id}`}>
        <div className="">
          <h2 className="font-bold mb-2 flex gap-1 whitespace-nowrap text-2xl saturate-50">
            <div onClick={handleUpdateEmoji} className="cursor-pointer">
              {list.emoji ?? randomEmoji({ seed: list.title })}
            </div>
            {list.title}
          </h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteList();
          }}
        >
          🗑️
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateTitle();
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
