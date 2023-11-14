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
import { renameScreen, useAppDispatch, useAppSelector } from "./store";
import randomColor from "randomcolor";
import { Map } from "./Map";

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
    // hue: "",
  });
};

const Screen = ({ name, fake = false, ...stackProps }: Props) => {
  const tasks = useAppSelector((state) => state.todo.values);
  const dispatch = useAppDispatch();
  const [row, column] = useContext(CoordinatesContext);

  const todos = tasks[name] ?? [];
  if (todos === undefined) return null;

  return (
    <VStack
      px={[5, 5, 10, 20, 300]}
      pt={10}
      height="100vh"
      spacing={2}
      id="later"
      align="stretch"
      divider={<StackDivider borderStyle="dotted" borderColor="gray.800" />}
      // ref={autoAnimate as any}
      bg={getBg(name)}
      {...stackProps}
    >
      <HStack>
        <Map fake={fake} />
        <Editable
          key={name}
          defaultValue={fake ? undefined : name}
          onSubmit={(name) => {
            dispatch(renameScreen({ title: name, coords: [row, column] }));
          }}
          fontSize="3xl"
          fontWeight="bold"
          fontStyle="italic"
          placeholder="new"
          sx={{
            color: "gray.200",
            fontVariant: "all-small-caps",
          }}
        >
          <EditablePreview />

          <EditableInput />
          <EditableControls fake={fake} />
        </Editable>
      </HStack>

      {!fake && <Adder placeholder="faster things..." where={name} />}

      {todos.map((task, index) => (
        <ShortTask key={task.id} task={task} where={name} />
      ))}
    </VStack>
  );
};

function EditableControls({ fake }: { fake: boolean }) {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  return isEditing ? (
    <ButtonGroup justifyContent="center" size="xs" alignItems="center">
      <Button variant="ghost" {...getSubmitButtonProps()}>
        ✅
      </Button>
      <Button variant="ghost" {...getCancelButtonProps()}>
        ❌
      </Button>
    </ButtonGroup>
  ) : (
    <Button size="sm" variant="ghost" {...getEditButtonProps()}>
      {fake ? "➕" : "🖊️"}
    </Button>
  );
}

export default Screen;
