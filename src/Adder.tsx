import { ChangeEventHandler, forwardRef, useState } from "react";

import * as R from "ramda";
import { position$ } from "./App";
import { getRandomEmoji } from "./emojis";
import {
  TodoState,
  addTask,
  useAppDispatch,
  useAppSelector,
  type Todo,
} from "./store";
import { Input } from "./components/ui/input";
export interface Props extends Partial<HTMLInputElement> {
  initialEmoji?: string;
  where?: keyof TodoState;
}

const Adder = forwardRef<"div", Props>((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;
  const dispatch = useAppDispatch();
  const [row, column] = position$.get();
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
      id: window.crypto.randomUUID(),
      title: {
        text: text,
        emoji: getRandomEmoji(text),
      },
      createdAt: new Date(),
      progress: 0,
    };

    try {
      const destination = where ?? structure[row][column];

      dispatch(
        addTask({
          key: destination,
          task,
          coords: [row, column],
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
