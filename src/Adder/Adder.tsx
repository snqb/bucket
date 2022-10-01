import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
  InputRightElement,
  Kbd,
} from "@chakra-ui/react";
import getEmojiFromText from "emoji-from-text";
import { nanoid } from "nanoid";
import { ChangeEventHandler, useState } from "react";
import { ITask, useTasks } from "../data/useTasks";

const Adder = () => {
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

  const onAdd = () => {
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
        id="adder"
        type="text"
        value={text}
        textTransform="lowercase"
        placeholder="empty your head bro"
        variant="flushed"
        onChange={handleChange}
        onKeyDown={({ key }) => {
          if (key === "Enter") {
            onAdd();
          }
        }}
        onInput={handleInputChange}
      />
      <InputRightElement onClick={onAdd} fontSize="2xl" children="↵" />
    </InputGroup>
  );
};

export default Adder;
