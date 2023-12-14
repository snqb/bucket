import {
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  forwardRef,
} from "@chakra-ui/react";
import { ChangeEventHandler, useContext, useState } from "react";

import * as R from "ramda";
import Rand from "rand-seed";
import { CoordinatesContext } from "./App";
import { Plusik } from "./Plusik";
import { emojis } from "./emojis";
import {
  addTask,
  renameScreen,
  useAppDispatch,
  useAppSelector,
  type Todo,
} from "./store";
export interface Props extends InputGroupProps {
  what: "task" | "screen";
  taskMode?: "fast" | "slow";
  initialEmoji?: string;
}

const Adder = forwardRef<Props, "div">((props, ref) => {
  const {
    placeholder,
    what = "task",
    initialEmoji = "+",
    taskMode,
    ...inputGroupProps
  } = props;
  const dispatch = useAppDispatch();
  const [row, column] = useContext(CoordinatesContext);
  const structure = useAppSelector((state) => state.todo.structure);

  const [text, setText] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.target.value,
    setText,
  );

  const onAdd = (e: any) => {
    e.preventDefault();
    if (!text) return;

    const task: Todo = {
      id: crypto.randomUUID(),
      title: {
        text: text.toLowerCase(),
        emoji: getRandomEmoji(text),
      },
      createdAt: new Date(),
      progress: taskMode === "slow" ? 1 : 0,
    };

    try {
      if (what === "task") {
        const where = structure[row][column];

        dispatch(
          addTask({
            key: where,
            task,
            coords: [row, column],
          }),
        );
      } else if (what === "screen") {
        dispatch(renameScreen({ title: text, coords: [row, column] }));
      }
    } catch (e) {
      console.error(e);
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
    }
  };

  return (
    <InputGroup
      variant="outline"
      opacity={0.9}
      size="md"
      ref={ref}
      {...inputGroupProps}
    >
      <InputLeftElement pointerEvents="none">
        {text.length === 0 ? (
          <Plusik isActive>{initialEmoji}</Plusik>
        ) : (
          <span>{getRandomEmoji(text)}</span>
        )}
      </InputLeftElement>
      <Input
        enterKeyHint="done"
        type="text"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={onAdd}
        placeholder={placeholder} // it doesn't work if you pass it to input group for some reason
        _placeholder={{
          color: "white",
        }}
        onKeyDown={R.when((e) => e.key === "Enter", onAdd)}
        bg="gray.900"
      />
    </InputGroup>
  );
});

export default Adder;

export function getRandomEmoji(seed = "") {
  const seededRandom = new Rand(seed);
  return emojis[Math.floor(seededRandom.next() * emojis.length)];
}
