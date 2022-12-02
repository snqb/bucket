import {
  forwardRef,
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";
import getEmojiFromText from "emoji-from-text";
import { nanoid } from "nanoid";
import { ChangeEventHandler, useCallback, useState } from "react";
import { ITask, useTasks } from "../data/useTasks";

import * as R from "ramda";

const Adder = forwardRef<InputGroupProps, "div">((props, ref) => {
  const { addTask } = useTasks();
  const [emoji, setEmoji, clearEmoji] = useInputEmoji();
  const [text, setText] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.currentTarget.value,
    setText
  );

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.currentTarget.value,
    R.cond([
      [R.either(R.isEmpty, R.isNil), clearEmoji],
      [
        R.T,
        R.pipe(
          (text) => getEmojiFromText(text, true)?.match?.emoji.char,
          setEmoji
        ),
      ],
    ])
  );

  const onAdd = () => {
    if (!text) return;

    const task: ITask = {
      id: nanoid(),
      title: {
        text,
        emoji,
      },
      createdAt: new Date(),
      progress: 1,
      wasSentTo: "bucket",
    };

    try {
      addTask(task);
    } catch (e) {
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
      clearEmoji();
    }
  };

  return (
    <InputGroup variant="outline" size="md" ref={ref} {...props}>
      <InputLeftElement pointerEvents="none" children={<span>{emoji}</span>} />
      <Input
        id="adder"
        type="text"
        value={text}
        textTransform="lowercase"
        placeholder="write it down"
        variant="outline"
        onChange={handleChange}
        onKeyDown={R.when((e) => e.key === "Enter", onAdd)}
        onInput={handleInputChange}
      />
      <InputRightElement onClick={onAdd} fontSize="2xl" children="↵" />
    </InputGroup>
  );
});

const useInputEmoji = (): [string, (newEmoji: string) => void, () => void] => {
  const DEFAULT = "🏄‍♂️";
  const [emoji, setEmoji] = useState(DEFAULT);

  const clear = useCallback(() => setEmoji(DEFAULT), []);

  return [emoji, setEmoji, clear];
};

export default Adder;
