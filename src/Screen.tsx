import {
  Button,
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  HStack,
  IconButton,
  StackDivider,
  StackProps,
  VStack,
  useEditableControls,
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ShortTask } from "./Task";

import { has } from "ramda";
import { useContext, useState } from "react";
import Adder from "./Adder";
import { CoordinatesContext } from "./App";
import { changeTitle, useAppDispatch, useAppSelector } from "./store";
import randomColor from "randomcolor";
import { Map } from "./Map";

interface Props extends StackProps {
  name: string;
}

const getBg = (name: string) => {
  return randomColor({
    luminosity: "dark",
    seed: name,
    format: "rgba",
    alpha: 0.07,
    hue: "blue",
  });
};

const Screen = ({ name, ...stackProps }: Props) => {
  const tasks = useAppSelector((state) => state.todo.values);
  const x = useAppSelector((state) => state.todo.structure);
  const dispatch = useAppDispatch();
  const [row, column] = useContext(CoordinatesContext);

  const todos = tasks[name] ?? [];

  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });
  return (
    <VStack
      px={[5, 5, 10, 20, 300]}
      pt={10}
      height="100vh"
      spacing={2}
      id="later"
      align="stretch"
      divider={<StackDivider borderStyle="dotted" borderColor="gray.800" />}
      ref={autoAnimate as any}
      bg={getBg(name)}
      {...stackProps}
    >
      <HStack>
        <Map position={[row, column]} slides={x} />
        <Editable
          key={name}
          defaultValue={name}
          onSubmit={(name) => {
            dispatch(changeTitle({ title: name, coords: [row, column] }));
          }}
          fontSize="3xl"
          fontWeight="bold"
        >
          <EditablePreview />
          <EditableInput />
          <EditableControls />
        </Editable>
      </HStack>

      <Adder placeholder="faster things..." where={name} />

      {todos.map((task, index) => (
        <ShortTask key={task.id} task={task} where={name} />
      ))}
    </VStack>
  );
};

function EditableControls() {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  return isEditing ? (
    <ButtonGroup justifyContent="center" size="sm">
      <Button variant="ghost" {...getSubmitButtonProps()}>
        ✅
      </Button>
      <Button variant="ghost" {...getCancelButtonProps()}>
        ❌
      </Button>
    </ButtonGroup>
  ) : (
    <Button variant="ghost" {...getEditButtonProps()}>
      🖊️
    </Button>
  );
}

export default Screen;
