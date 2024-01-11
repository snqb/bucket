import { Box, Heading, StackDivider, StackProps, VStack } from "@chakra-ui/react";
import { Task } from "./Task";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { lt, partition, pipe, prop } from "ramda";
import randomColor from "randomcolor";
import Adder, { getRandomEmoji } from "./Adder";
import { Map } from "./Map";
import { useAppSelector } from "./store";
interface Props extends StackProps {
  name: string;
  fake?: boolean;
}

const getBg = (name: string) => {
  return randomColor({
    luminosity: "light",
    seed: name,
    format: "rgba",
    alpha: 0.07,
  });
};

const Screen = ({ name, fake = false, ...stackProps }: Props) => {
  const tasks = useAppSelector((state) => state.todo.values);
  const [animationParent] = useAutoAnimate({
    duration: 420,
    easing: "ease-out",
  });

  const todos = tasks[name] ?? [];

  if (todos === undefined) return null;

  const divideSlowsAndFasts = partition(pipe(prop("progress"), lt(0)));
  const [slows, fasts] = divideSlowsAndFasts(todos);

  return (
    <VStack
      key={name}
      px={[5, 5, 10, 20, 300]}
      pt={4}
      height="100dvh"
      spacing={3}
      id="later"
      align="stretch"
      bg={getBg(name)}
      {...stackProps}
    >

      <Heading fontSize="2xl" fontWeight="bold" mb={2}>
        {getRandomEmoji(name)}{name}
      </Heading>

      <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />

      <VStack transition="all 1s linear" align="stretch" spacing={fake ? 1 : 4} ref={animationParent as any}>
        <Adder
          where={name}
          initialEmoji={"👊"}
          autoFocus
          what="task"
          variant="filled"
          size="md"
          taskMode="slow"
          sx={{
            borderRadius: "4px",
          }}
          boxShadow={`inset 0 0 0.5px 1px hsla(0, 0%,  
        100%, 0.075),
        /* shadow ring 👇 */
        0 0 0 5px hsla(0, 0%, 0%, 0.05),
        /* multiple soft shadows 👇 */
        0 0.3px 0.4px hsla(0, 0%, 0%, 0.02),
        0 0.9px 1.5px hsla(0, 0%, 0%, 0.045),
        0 3.5px 6px hsla(0, 0%, 0%, 0.09);`}
        />
        {todos.map((task) => (
          <Task mode="slow" key={task.id} task={task} where={name} />
        ))}
      </VStack>

    </VStack>
  );
};


export default Screen;
