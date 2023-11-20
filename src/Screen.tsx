import {
  AbsoluteCenter,
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

import randomColor from "randomcolor";
import { useContext } from "react";
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
      <HStack align="center">
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
          placeholder="untitled"
          sx={{
            color: fake && "gray.700",
          }}
          _focusWithin={{
            color: "gray.200",
          }}
          w="full"
        >
          <HStack w="full" align="center">
            <EditablePreview />
            <EditableInput fontSize="lg" />
            {!fake && (
              <EditableControls
                onRemove={() => {
                  dispatch(
                    removeScreen({ title: name, coords: [row, column] }),
                  );
                }}
                fake={fake}
              />
            )}
          </HStack>
          {fake && <CreateButton />}
        </Editable>
      </HStack>

      {!fake && <Adder placeholder={`№` + (todos.length + 1)} where={name} />}

      {todos.map((task, index) => (
        <ShortTask key={task.id} task={task} where={name} />
      ))}
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
    <ButtonGroup
      flex="1"
      w="max-content"
      justifyContent="space-between"
      alignItems="baseline"
    >
      <Button size="xs" variant="ghost" {...getEditButtonProps()}>
        {fake ? "🆕" : "🖊️"}
      </Button>
      {!fake && (
        <Button type="button" variant="ghost" onClick={onRemove}>
          🗑️
        </Button>
      )}
    </ButtonGroup>
  );
}

export default Screen;
