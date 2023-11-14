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

import {
  asCSS,
  chroma,
  compFilter,
  cssThemes,
  hue,
  luma,
  proximityRGB,
} from "@thi.ng/color-palettes";

import { has } from "ramda";
import { useContext, useState } from "react";
import Adder from "./Adder";
import { CoordinatesContext } from "./App";
import { renameScreen, useAppDispatch, useAppSelector } from "./store";
import randomColor from "randomcolor";
import { Map } from "./Map";
import { prng_alea } from "esm-seedrandom";
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

const pastels = compFilter(
  // require all theme colors to have max 25% chroma
  // chroma(0, 0.25),
  // require at least 3 theme colors to have min 50% luma
  chroma(0, 0.3, 1),
  luma(0, 0.3, 3),
  hue(0.7, 1, 1),
);

const colors = [...cssThemes(pastels)];

console.log(colors);
const Screen = ({ name, fake = false, ...stackProps }: Props) => {
  const tasks = useAppSelector((state) => state.todo.values);
  const dispatch = useAppDispatch();
  const [row, column] = useContext(CoordinatesContext);
  const random = prng_alea(name);

  const [bg, current, cell, adding, ...rest] =
    colors?.[(colors.length * random()) | 0];

  const todos = tasks[name] ?? [];
  if (todos === undefined) return null;

  return (
    <VStack
      px={[5, 5, 10, 20, 300]}
      pt={4}
      height="100vh"
      spacing={2}
      id="later"
      align="stretch"
      divider={<StackDivider borderStyle="dotted" borderColor="gray.800" />}
      // ref={autoAnimate as any}
      bg={bg}
      {...stackProps}
    >
      <HStack>
        <Map cellColor={cell} currentColor={current} fake={fake} />
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
          <HStack>
            <EditablePreview />
            <EditableInput fontSize="lg" />
            <EditableControls fake={fake} />
          </HStack>
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
    <Button
      display="inline"
      size="sm"
      variant="ghost"
      {...getEditButtonProps()}
    >
      {fake ? "➕" : "🖊️"}
    </Button>
  );
}

export default Screen;
