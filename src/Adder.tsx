import { ChangeEventHandler, forwardRef, useState } from "react";

import * as R from "ramda";
import { Input } from "./components/ui/input";
import { getRandomEmoji } from "./emojis";
import { TodoState, addTask, useAppDispatch, type Todo } from "./store";
export interface Props extends Partial<HTMLInputElement> {
  initialEmoji?: string;
  where: keyof TodoState;
}

const Adder = forwardRef<"div", Props>((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;
  const dispatch = useAppDispatch();

  const [text, setText] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.target.value,
    setText,
  );

  const onAdd = (e: any) => {
    e.preventDefault();
    if (!text) return;

    const task: Todo = {
      id: window.crypto.randomUUID(),
      title: {
        text: text,
        emoji: getRandomEmoji(text),
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
      console.error(e);
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
    }
  };

  return (
    <Input
      className="w-full bg-gray-900 bg-opacity-80"
      enterKeyHint="done"
      type="text"
      autoComplete="off"
      value={text}
      onChange={handleChange}
      onBlur={onAdd}
      onKeyDown={R.when((e) => e.key === "Enter", onAdd)}
      placeholder={props.placeholder ?? "..."}
    />
  );
});

export default Adder;
