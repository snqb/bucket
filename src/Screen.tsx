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
import { ComponentProps, memo, useMemo, useTransition } from "react";
import Adder from "./Adder";
import { mode$, position$ } from "./App";
import { getRandomEmoji } from "./emojis";
import {
  removeScreen,
  renameScreen,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { observable } from "@legendapp/state";

const MVStack = motion(VStack);
type H = ComponentProps<typeof MVStack>;
type Props = H & {
  name: string;
};

const getBg = (name: string) => {
  console.log(name);
  return randomColor({
    luminosity: "light",
    seed: name,
    format: "rgba",
    alpha: 0.07,
  });
};

export const preventDrag$ = observable(false);

const Screen = ({ name, ...stackProps }: Props) => {
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
      drag={!preventDrag$.get()}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.3}
      transition={{
        type: "spring",
        duration: 0.2,
      }}
      initial={{ left: "-100%" }}
      exit={{ left: "100%" }}
      animate={{
        left: 0,
      }}
      bg={bg}
      key={name}
      height="full"
      px={[5, 5, 10, 20, 300]}
      pt={4}
      spacing={3}
      data-name={name}
      align="stretch"
      overflow="hidden"
      {...stackProps}
    >
      <HStack justify="space-between">
        {!zoomedOut && (
          <HStack filter="saturate(0)">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeScreen({ coords: [row, column] }));
              }}
            >
              🗑️
            </Button>
            <Button
              size="xs"
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

      {!zoomedOut && (
        <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />
      )}

      <VStack align="stretch" spacing={1}>
        {!zoomedOut && <Adder where={name} />}
        <AnimatePresence initial={false}>
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

export default memo(Screen);
