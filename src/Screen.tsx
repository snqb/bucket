import {
  AbsoluteCenter,
  Button,
  StackDivider,
  StackProps,
  VStack,
  useBoolean,
  useEditableControls,
  useTimeout,
} from "@chakra-ui/react";
import { Task } from "./Task";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import randomColor from "randomcolor";
import Adder from "./Adder";
import { Map } from "./Map";
import { TodoState, useAppSelector } from "./store";
import { useRef, useState } from "react";
import { lt, partition, pipe, prop } from "ramda";
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
      spacing={2}
      id="later"
      align="stretch"
      // divider={
      //   <StackDivider borderBottomColor="gray.900" borderBottomWidth="5px" />
      // }
      bg={getBg(name)}
      {...stackProps}
    >
      <Map />

      <TextualAdder mode="slow" todos={todos} />

      <VStack key={name} align="stretch" ref={animationParent as any}>
        {slows.map((task) => (
          <Task mode="slow" key={task.id} task={task} where={name} />
        ))}
        <StackDivider borderBottomColor="gray.700" borderBottomWidth="1px" />
        {fasts.map((task) => (
          <Task mode="fast" key={task.id} task={task} where={name} />
        ))}
      </VStack>

      <TextualAdder mode="fast" todos={todos} />
    </VStack>
  );
};

const TextualAdder = ({
  todos,
  mode = "slow",
}: {
  todos: TodoState["values"]; // this doesn't make sense, todo: refactor reducer to include coordinates in it -> derive
  mode?: "slow" | "fast";
}) => {
  const tasks = useAppSelector((it) => it.todo.values);
  const [showAdder, { on: turnOnAdder, off: turnOffAdder }] = useBoolean(false);
  const [showTextual, { on: turnOnText, off: turnOffText }] = useBoolean(true);

  const hueref = useRef<any>();

  // if (showTextual) {
  //   return (
  //     <Button
  //       onClick={pipe(turnOnAdder, turnOffText)}
  //       variant="unstyled"
  //       color="gray.600"
  //       opacity="0.8"
  //       p={0}
  //     >
  //       Add {mode}...
  //     </Button>
  //   );
  // }

  return (
    <Adder
      initialEmoji={mode === "fast" ? "👊" : "🌊"}
      autoFocus
      placeholder={`something ${mode}~`}
      what="task"
      onBlur={pipe(turnOffAdder, turnOnText)}
      variant=""
      ref={hueref}
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
