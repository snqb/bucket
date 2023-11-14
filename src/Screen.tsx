import {
  Button,
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  StackDivider,
  StackProps,
  VStack,
  useEditableControls,
} from "@chakra-ui/react";
import { ShortTask } from "./Task";

import { chroma, compFilter, cssThemes, luma } from "@thi.ng/color-palettes";

import { prng_alea } from "esm-seedrandom";
import randomColor from "randomcolor";
import { useContext } from "react";
import tinycolor from "tinycolor2";
import Adder from "./Adder";
import { CoordinatesContext } from "./App";
import { Map } from "./Map";
import {
  removeScreen,
  renameScreen,
  useAppDispatch,
  useAppSelector,
} from "./store";
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
  chroma(0, 0.5, 3),
  luma(0, 0.5, 3),
  // hue(0.7, 1, 1),
);

const colors = [...cssThemes(pastels)];
const bgs = colors.filter((it) =>
  tinycolor.isReadable(it[0], "#fff", { level: "AAA", size: "large" }),
);
console.log(colors, bgs);

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
      <HStack align="center">
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
          _placeholder={{
            fontVariant: "all-small-caps",
          }}
          w="full"
        >
          <HStack w="full" align="baseline">
            <EditablePreview />
            <EditableInput fontSize="lg" />
            <EditableControls
              onRemove={() => {
                console.log("huemoe");
                dispatch(removeScreen({ title: name, coords: [row, column] }));
              }}
              fake={fake}
            />
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

function EditableControls({
  fake,
  onRemove,
}: {
  fake: boolean;
  onRemove: () => void;
}) {
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
      </Button>{" "}
      <Button variant="ghost" {...getCancelButtonProps()}>
        ❌
      </Button>
    </ButtonGroup>
  ) : (
    <ButtonGroup flex="1" w="max-content" justifyContent="space-between">
      <Button size="sm" variant="ghost" {...getEditButtonProps()}>
        {fake ? "➕" : "🖊️"}
      </Button>
      {!fake && (
        <Button type="button" variant="ghost" onClick={onRemove}>
          🚮
        </Button>
      )}
    </ButtonGroup>
  );
}

export default Screen;
