import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
  Text,
} from "@chakra-ui/react";
import getEmojiFromText from "emoji-from-text";
import { FormEventHandler, useRef, useState } from "react";
import { useTasks } from "../data/useTasks";
import { nanoid } from "nanoid";

const Adder = () => {
  const { addTask } = useTasks();
  const [emoji, setEmoji] = useState("🌊");
  const [text, setText] = useState("");

  const handleChange: FormEventHandler = (e) => {
    const text = (e.target as any).value;

    setText(text);
  };

  const handleInputChange: FormEventHandler = (e) => {
    const text = (e.target as any).value;

    if (text) {
      const _emoji = getEmojiFromText(text, true)?.match?.emoji.char;
      setEmoji(_emoji);
    } else {
      setEmoji("");
    }
  };

  const onAdd = () => {
    if (text) {
      addTask({
        id: nanoid(),
        title: {
          text,
          emoji,
        },
        createdAt: new Date(),
      });

      setText("");
      setEmoji("🌊");
    }
    console.log(text, emoji);
  };

  return (
    <InputGroup>
      <InputLeftElement pointerEvents="none" children={<span>{emoji}</span>} />
      <Input
        borderStyle="dashed"
        value={text}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd();
          }
        }}
        onInput={handleInputChange}
        type="text"
        placeholder="empty your head bro"
      />
      <InputRightAddon
        onClick={onAdd}
        children={<Text color="green.500">✔️</Text>}
      />
    </InputGroup>
  );
};

export default Adder;
