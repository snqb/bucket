import {
  Button,
  HStack,
  Heading,
  StackDivider,
  VStack,
} from "@chakra-ui/react";
import { Task } from "./Task";

import { AnimatePresence, motion } from "framer-motion";
import randomColor from "randomcolor";
import { ComponentProps, useMemo, useTransition } from "react";
import Adder from "./Adder";
import { mode$, position$ } from "./App";
import { getRandomEmoji } from "./emojis";
import {
  removeScreen,
  renameScreen,
  useAppDispatch,
  useAppSelector,
} from "./store";

const MVStack = motion(VStack);
type H = ComponentProps<typeof MVStack>;
type Props = H & {
  name: string;
  fake?: boolean;
};

const getBg = (name: string) => {
  return randomColor({
    luminosity: "light",
    seed: name,
    format: "rgba",
    alpha: 0.07,
  });
};

const Screen = ({ name, fake = false, ...stackProps }: Props) => {
  const bg = useMemo(() => getBg(name), [name]);
  const tasks = useAppSelector((state) => state.todo.values);
  const dispatch = useAppDispatch();
  const [row, column] = position$.get();

  const todos = tasks[name] ?? [];

  if (todos === undefined) return null;

  const zoomedOut = mode$.get() === 1;

  useTransition();
  return (
    <MVStack
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.3}
      whileDrag={{
        filter: "saturate(20%)",
      }}
      transition={{
        type: "tween",
        duration: 0.1,
        ease: "easeInOut",
      }}
      initial={{ opacity: 0.5 }}
      exit={{ opacity: 0 }}
      animate={{
        opacity: 1,
      }}
      bg={bg}
      key={name}
      px={[5, 5, 10, 20, 300]}
      pt={4}
      height="100dvh"
      spacing={3}
      id="later"
      align="stretch"
      textAlign={zoomedOut ? "left" : "right"}
      overflow="hidden"
      {...stackProps}
    >
      <HStack justify="space-between">
        {!zoomedOut && (
          <HStack>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeScreen({ coords: [row, column] }));
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
                  dispatch(renameScreen({ coords: [row, column], newName }));
                }
              }}
            >
              ✏️
            </Button>
          </HStack>
        )}
        <Heading fontSize="2xl" fontWeight="bold" mb={2}>
          {getRandomEmoji(name)}
          {name}
        </Heading>
      </HStack>

      <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />

      <VStack align="stretch" spacing={fake ? 1 : 4}>
        <Adder
          where={name}
          initialEmoji={"👊"}
          autoFocus
          placeholder="..."
          what="task"
          variant="filled"
          size="md"
        />
        <AnimatePresence>
          {todos.map((task) => (
            <Task
              initial={{ transform: "translateY(-100%)" }}
              animate={{
                transform: "translateY(0)",
              }}
              exit={{
                opacity: 0,
              }}
              mode="slow"
              key={task.id}
              task={task}
              where={name}
            />
          ))}
        </AnimatePresence>
      </VStack>
    </MVStack>
  );
};

export default Screen;
