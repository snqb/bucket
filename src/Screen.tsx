import {
  AbsoluteCenter,
  Button,
  StackDivider,
  StackProps,
  VStack,
  useEditableControls,
} from "@chakra-ui/react";
import { Task } from "./Task";

import { useAutoAnimate } from "@formkit/auto-animate/react";
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
  const [animationParent] = useAutoAnimate();

  const todos = tasks[name] ?? [];
  if (todos === undefined) return null;

  return (
    <VStack
      px={[5, 5, 10, 20, 300]}
      pt={4}
      height="100dvh"
      spacing={2}
      id="later"
      align="stretch"
      divider={
        <StackDivider borderBottomColor="gray.900" borderBottomWidth="5px" />
      }
      bg={getBg(name)}
      {...stackProps}
    >
      <Map />

      {!fake && <Adder placeholder={`№` + (todos.length + 1)} what="task" />}

      <VStack key={name} align="stretch" ref={animationParent as any}>
        {todos.map((task) => (
          <Task key={task.id} task={task} where={name} />
        ))}
      </VStack>
    </VStack>
  );
};

const CreateButton = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  if (isEditing)
    return (
      <AbsoluteCenter>
        <Button {...getSubmitButtonProps()}>Save</Button>
      </AbsoluteCenter>
    );

  return (
    <AbsoluteCenter>
      <Button
        {...getEditButtonProps()}
        fontSize="xl"
        fontWeight="bold"
        colorScheme="pink"
        aspectRatio="21/9"
        size="lg"
      >
        +
      </Button>
    </AbsoluteCenter>
  );
};

export default Screen;
