import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
} from "@chakra-ui/react";
import getEmojiFromText from "emoji-from-text";
import { nanoid } from "nanoid";
import { FormEventHandler, useState } from "react";
import { useTasks } from "../data/useTasks";

interface Props {
  today?: boolean;
}

const Adder = ({ today = false }: Props) => {
  const { addTask, moveToToday } = useTasks();
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
      progress: 0,
    };

    try {
      addTask(task);

      if (today) {
        moveToToday(task);
      }
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
        textTransform="lowercase"
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
};

export default Adder;
