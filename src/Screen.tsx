import {
  Button,
  HStack,
  Heading,
  StackDivider,
  VStack,
} from "@chakra-ui/react";
import { Task } from "./Task";

import { AnimatePresence, motion, useInView } from "framer-motion";
import randomColor from "randomcolor";
import { ComponentProps, memo, useEffect, useMemo, useRef } from "react";
import Adder from "./Adder";
import { $currentScreen, level$, position$ } from "./App";
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
  x: number;
  y: number;
};

const getBg = (name: string) => {
  return randomColor({
    luminosity: "light",
    seed: name,
    format: "rgba",
    alpha: 0.07,
  });
};

export const preventDrag$ = observable(false);

const Screen = ({ name, x, y, ...stackProps }: Props) => {
  const bg = useMemo(() => getBg(name), [name]);
  const tasks = useAppSelector((state) => state.todo.values);
  const dispatch = useAppDispatch();
  const ref = useRef();

  const isInView = useInView(ref, {
    amount: 1,
    root: "#screens",
  });

  const level = level$.get();

  useEffect(() => {
    if (isInView && level === 2) {
      $currentScreen.set(name);
    }
  }, [isInView, name]);

  const todos = tasks[name] ?? [];

  if (todos === undefined) return null;

  return (
    <MVStack
      ref={ref}
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
        <HStack filter="saturate(0)" opacity={level === 1 ? 0.5 : 1}>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(removeScreen({ coords: [y, x] }));
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
                dispatch(renameScreen({ coords: [y, x], newName }));
              }
            }}
          >
            ✏️
          </Button>
        </HStack>
        <Heading fontSize="2xl" fontWeight="bold" mb={2} whiteSpace="nowrap">
          {getRandomEmoji(name)}
          {name}
        </Heading>
      </HStack>

      {<StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />}

      <VStack align="stretch" spacing={2}>
        {<Adder where={name} />}
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
