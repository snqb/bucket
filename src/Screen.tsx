import { Box, StackDivider, StackProps, VStack } from "@chakra-ui/react";
import { Task } from "./Task";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { lt, partition, pipe, prop } from "ramda";
import randomColor from "randomcolor";
import Adder from "./Adder";
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
      px={[5, 5, 10, 20, 300]}
      pt={4}
      height="100dvh"
      spacing={1}
      id="later"
      align="stretch"
      bg={getBg(name)}
      {...stackProps}
    >
      <Box mb={2}>
        <Map />
      </Box>

      <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />

      <VStack key={name} align="stretch">
        <VStack align="stretch" spacing={1} ref={animationParent as any}>
          <TaskAdder mode="slow" />
          {slows.map((task) => (
            <Task mode="slow" key={task.id} task={task} where={name} />
          ))}
        </VStack>

        <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />

        <VStack align="stretch" spacing={1} ref={animationParent as any}>
          <TaskAdder mode="fast" />
          {fasts.map((task) => (
            <Task mode="fast" key={task.id} task={task} where={name} />
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
};

const TaskAdder = ({ mode = "slow" }: { mode?: "slow" | "fast" }) => {
  return (
    <Adder
      initialEmoji={mode === "fast" ? "👊" : "🌊"}
      autoFocus
      placeholder={`something ${mode}~`}
      what="task"
      variant="outline"
      borderColor="gray.700"
      size="md"
      taskMode={mode}
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
  );
};

export default Screen;
