import { Task } from "./Task";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";
import randomColor from "randomcolor";
import { memo, useMemo, useRef } from "react";
import Adder from "./Adder";
import { pb } from "./App";
import { Button } from "./components/ui/button";
import { getRandomEmoji } from "./emojis";

type Props = HTMLMotionProps<"div"> & {
  name: string;
  collectionId: string;
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

const Screen = ({ name, x, y, collectionId, ...divProps }: Props) => {
  const ref = useRef<Element>(document.querySelector("#screens")!);
  const client = useQueryClient();
  const { data: todos } = useSuspenseQuery({
    queryKey: ["task", name],
    queryFn: async () => {
      const task = await pb
        .collection("tasks")
        .getFullList({ filter: `screen.title = "${name}"` });
      return task;
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      await pb.collection("screens").delete(collectionId);
    },
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["screens"],
      });
    },
  });

  const bg = useMemo(() => getBg(name, 0.1), [name]);

  if (todos === undefined) return null;

  return (
    <motion.div
      className={`m-2 flex h-full flex-col items-stretch gap-3 overflow-hidden border border-gray-600 bg-opacity-15 px-5 pb-9 pt-6`}
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
      <div className={`flex saturate-0`} id={`screen-${name}`}>
        <div className="">
          <h2 className="font-bold mb-2 whitespace-nowrap text-2xl">
            {getRandomEmoji(name)}
            {name}
          </h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            const confirm = window.confirm(`Delete ${name}?`);
            if (confirm) {
              remove.mutate();
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
            // if (newName && !tasks[newName]) {
            //   dispatch(renameScreen({ coords: [y, x], newName }));
            // }
          }}
        >
          ✏️
        </Button>
      </div>

      <hr className="border-gray-500" />

      <div className="flex flex-col items-stretch gap-2">
        <Adder collectionId={collectionId} where={name} />
        <AnimatePresence initial={false} mode="popLayout">
          {todos.map((task, index) => (
            <Task
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
              key={index}
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
