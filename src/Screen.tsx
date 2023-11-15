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

const colors = [...cssThemes(pastels)].map(([bg, ...rest]) => [
  tinycolor(bg).darken(20).toString(),
  ...rest,
]);
const bgs = colors.filter(([bg, ...rest]) => {
  const color = tinycolor(bg);
  return (
    tinycolor.readability("#fff", color) > 11 &&
    color.isDark() &&
    color.getBrightness() < 33
  );
});

const Screen = ({ name, fake = false, ...stackProps }: Props) => {
  const tasks = useAppSelector((state) => state.todo.values);
  const dispatch = useAppDispatch();
  const [row, column] = useContext(CoordinatesContext);

  const seedRandom = prng_alea(name);
  const [bg, current, cell, adding, two, three] =
    colors?.[(colors.length * seedRandom()) | 0];

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
      divider={<StackDivider borderStyle="dotted" borderColor={current} />}
      bg={bg}
      {...stackProps}
    >
      <HStack align="center">
        <Map
          colors={{
            active: current,
            cell,
            one: adding,
            two,
            three,
            four: "",
          }}
          fake={fake}
        />
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
                dispatch(removeScreen({ title: name, coords: [row, column] }));
              }}
              fake={fake}
            />
          </HStack>
        </Editable>
      </HStack>

      {!fake && (
        <Adder
          bg={tinycolor(current).darken(15).toString()}
          placeholder="faster things..."
          where={name}
        />
      )}

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
