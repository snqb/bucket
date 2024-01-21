import { Heading, StackDivider, VStack } from "@chakra-ui/react";
import { Task } from "./Task";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion } from "framer-motion";
import randomColor from "randomcolor";
import { ComponentProps, useMemo, useTransition } from "react";
import Adder from "./Adder";
import { getRandomEmoji } from "./emojis";
import { useAppSelector } from "./store";

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
  const [animationParent] = useAutoAnimate({
    duration: 420,
    easing: "ease-out",
  });

  const todos = tasks[name] ?? [];

  if (todos === undefined) return null;

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
      {...stackProps}
    >
      <Heading fontSize="2xl" fontWeight="bold" mb={2}>
        {getRandomEmoji(name)}
        {name}
      </Heading>

      <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />

      <VStack
        align="stretch"
        spacing={fake ? 1 : 4}
        ref={animationParent as any}
      >
        <Adder
          where={name}
          initialEmoji={"👊"}
          autoFocus
          what="task"
          variant="filled"
          size="md"
        />
        {todos.map((task) => (
          <Task mode="slow" key={task.id} task={task} where={name} />
        ))}
      </VStack>
    </MVStack>
  );
};

export default Screen;
