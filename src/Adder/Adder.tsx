import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightAddon,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import getEmojiFromText from "emoji-from-text";
import { FormEventHandler, useRef, useState } from "react";
import { useTasks } from "../data/useTasks";
import { nanoid } from "nanoid";

interface Props {
  today?: boolean;
}

const Adder = ({ today = false }: Props) => {
  const { addTask: addTaskToBucket, addTaskToday } = useTasks();
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

  const onAdd = ({ today } = { today: false }) => {
    if (!text) return;

    const task = {
      id: nanoid(),
      title: {
        text,
        emoji,
      },
      createdAt: new Date(),
    };

    const adder = today ? addTaskToday : addTaskToBucket;

    try {
      adder(task);
    } catch (e) {
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
      setEmoji("🌊");
    }
  };

  return (
    <InputGroup variant="outline" size="md">
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
      {today && (
        <InputRightAddon
          onClick={() => onAdd({ today: true })}
          borderRadius="none"
          children="😭"
        />
      )}

      <InputRightAddon onClick={() => onAdd()} children="🪣" />
    </InputGroup>
  );

  // return (
  //   <InputGroup>

  //     <InputRightElement onClick={onAdd} children={} />
  //   </InputGroup>
  // );
};

export default Adder;
