import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
} from "@chakra-ui/react";
import getEmojiFromText from "emoji-from-text";
import { nanoid } from "nanoid";
import { ChangeEventHandler, useState } from "react";
import { ITask, useTasks } from "../data/useTasks";

interface Props {
  today?: boolean;
}

const Adder = ({ today = false }: Props) => {
  const { addTask, moveToToday } = useTasks();
  const [emoji, setEmoji] = useState("🌊");
  const [text, setText] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = ({
    currentTarget: { value: text },
  }) => {
    setText(text);
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = ({
    currentTarget: { value: text },
  }) => {
    if (text) {
      const _emoji = getEmojiFromText(text, true)?.match?.emoji.char;
      setEmoji(_emoji);
    } else {
      setEmoji("");
    }
  };

  const onAdd = ({ today } = { today: false }) => {
    if (!text) return;

    const task: ITask = {
      id: nanoid(),
      title: {
        text,
        emoji,
      },
      createdAt: new Date(),
      progress: 0,
      wasSentTo: "bucket",
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
        type="text"
        value={text}
        textTransform="lowercase"
        placeholder="empty your head bro"
        borderStyle="dashed"
        onChange={handleChange}
        onKeyDown={({ key }) => {
          if (key === "Enter") {
            onAdd();
          }
        }}
        onInput={handleInputChange}
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
