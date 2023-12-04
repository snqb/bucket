import {
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  forwardRef,
} from "@chakra-ui/react";
import { ChangeEventHandler, useCallback, useContext, useState } from "react";

import * as R from "ramda";
import Rand from "rand-seed";
import { CoordinatesContext } from "./App";
import {
  addTask,
  renameScreen,
  useAppDispatch,
  useAppSelector,
  type Todo,
} from "./store";
import { emojis } from "./emojis";
export interface Props extends InputGroupProps {
  what: "task" | "screen";
}

const Adder = forwardRef<Props, "div">((props, ref) => {
  const { placeholder, what = "task" } = props;
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
      progress: 0,
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
    <InputGroup variant="outline" opacity={0.9} size="md" ref={ref} {...props}>
      <InputLeftElement pointerEvents="none">
        <span>{getRandomEmoji(text)}</span>
      </InputLeftElement>
      <Input
        enterKeyHint="done"
        type="text"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={onAdd}
        placeholder={placeholder}
        _placeholder={{
          color: "white",
        }}
        onKeyDown={R.when((e) => e.key === "Enter", onAdd)}
        bg="gray.900"
        borderColor="blackAlpha.900"
      />
      {/* <InputRightElement onClick={onAdd} fontSize="2xl" alignItems="center">
        ↵
      </InputRightElement> */}
    </InputGroup>
  );
});

export default Adder;

export function getRandomEmoji(seed = "") {
  const seededRandom = new Rand(seed);
  return emojis[Math.floor(seededRandom.next() * emojis.length)];
}
