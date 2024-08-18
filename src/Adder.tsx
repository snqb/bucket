import { ChangeEventHandler, forwardRef, useState } from "react";

import * as R from "ramda";
import { Input } from "./components/ui/input";
import { TodoItem, TodoList, bucketDB } from "./store";
export interface Props extends Partial<HTMLInputElement> {
  initialEmoji?: string;
  where: TodoList;
}

const Adder = forwardRef<"div", Props>((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;

  const [text, setText] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.target.value,
    setText,
  );

  const onAdd = (e: any) => {
    e.preventDefault();
    if (!text) return;

    const task: TodoItem = {
      title: text,
      progress: 0,
      todoListId: where.id!,
    };

    try {
      bucketDB.todoItems.put(task);
    } catch (e) {
      console.error(e);
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
    }
  };

  return (
    <Input
      className="w-full border-gray-700 bg-gray-900 bg-opacity-80"
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
