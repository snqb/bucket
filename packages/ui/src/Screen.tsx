import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";
import randomColor from "randomcolor";
import { memo, useMemo, useRef, useState } from "react";
import Adder from "./Adder";
import { useListTasks } from "@bucket/core";
import { Task } from "./Task";
import { Button } from "./components/ui/button";
import { X } from "lucide-react";
import type { List, BucketActions } from "@bucket/core";

type Props = HTMLMotionProps<"div"> & {
  list: List;
  actions?: BucketActions;
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

const Screen = ({ list, actions, ...divProps }: Props) => {
  const todos = useListTasks(String(list.id));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(String(list.title));

  const ref = useRef<Element>(document.querySelector("#screens")!);
  const bg = useMemo(() => getBg(list.title, 0.1), [list.title]);

  if (!todos) return null;

  return (
    <motion.div
      className={`m-2 flex flex-col items-stretch gap-3 overflow-hidden border border-gray-600 bg-opacity-15 px-5 pb-9 pt-6 md:px-8`}
      style={{
        background: bg,
      }}
      ref={ref as any}
      transition={{
        type: "spring",
        duration: 0.2,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      {...divProps}
    >
      {/* Header with title and emoji - only on desktop */}
      <div className="mb-4 hidden items-center gap-2 border-b border-gray-500 pb-2 md:flex">
        <span className="text-2xl">{list.emoji}</span>
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (editTitle.trim() && actions) {
                    actions.updateListTitle(String(list.id), editTitle.trim());
                  }
                  setIsEditingTitle(false);
                }
                if (e.key === "Escape") {
                  setEditTitle(String(list.title));
                  setIsEditingTitle(false);
                }
              }}
              className="font-semibold flex-1 rounded px-2 py-1 text-lg text-white bg-gray-700 border border-gray-600"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                if (editTitle.trim() && actions) {
                  actions.updateListTitle(String(list.id), editTitle.trim());
                }
                setIsEditingTitle(false);
              }}
              className="h-6 w-6 bg-green-600 p-0 text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <h2
            onClick={() => {
              setEditTitle(String(list.title));
              setIsEditingTitle(true);
            }}
            className="font-semibold cursor-pointer truncate rounded px-1 text-lg text-white hover:bg-gray-700"
          >
            {list.title}
          </h2>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-2">
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
              task={task as any}
            />
          ))}
        </AnimatePresence>
        <Adder where={list} className="mb-2" />
      </div>
    </motion.div>
  );
};

export default memo(Screen);
