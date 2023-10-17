import {
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  InputRightElement,
  forwardRef,
} from "@chakra-ui/react";
import { ChangeEventHandler, useCallback, useState } from "react";

import { type Todo, type TodoState, addTask, useAppDispatch } from "./store";
import * as R from "ramda";
import { emojis } from "./emojis";

export interface Props extends InputGroupProps {
  where: keyof TodoState;
}

const Adder = forwardRef<Props, "div">((props, ref) => {
  const { where, placeholder } = props;
  const dispatch = useAppDispatch();

  const [emoji, generateEmoji, clearEmoji] = useInputEmoji(getRandomEmoji());
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
        emoji,
      },
      createdAt: new Date(),
      progress: 0,
    };

    try {
      dispatch(
        addTask({
          key: where,
          task,
        }),
      );
    } catch (e) {
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
      clearEmoji();
    }
  };

  return (
    <InputGroup variant="outline" opacity={0.9} size="md" ref={ref} {...props}>
      <InputLeftElement pointerEvents="none">
        <span>{emoji}</span>
      </InputLeftElement>
      <Input
        textTransform="lowercase"
        enterKeyHint="done"
        id={`adder-${where}`}
        type="text"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={onAdd}
        onInput={generateEmoji}
        placeholder={placeholder}
        onKeyDown={R.when((e) => {
          return e.key === "Enter";
        }, onAdd)}
        bg="whiteAlpha.100"
      />
      <InputRightElement onClick={onAdd} fontSize="2xl">
        ↵
      </InputRightElement>
    </InputGroup>
  );
});

const useInputEmoji = (
  initial: string = getRandomEmoji(),
): [string, ChangeEventHandler<HTMLInputElement>, () => void] => {
  const [emoji, setEmoji] = useState(initial);

  const clearEmoji = useCallback(() => setEmoji(getRandomEmoji()), []);

  const generateEmojiFromText: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.currentTarget.value,
    R.cond([
      [R.either(R.isEmpty, R.isNil), clearEmoji],
      [R.T, R.pipe(getRandomEmoji, setEmoji)],
    ]),
  );

  return [emoji, generateEmojiFromText, clearEmoji];
};

export default Adder;

export function getRandomEmoji() {
  return emojis[Math.floor(Math.random() * emojis.length)];
}
