import { ChangeEventHandler, forwardRef, useState } from "react";

import * as R from "ramda";
import { Input } from "./components/ui/input";
import { useActions } from "./tinybase-hooks";
import { cn } from "./lib/utils";
export interface Props extends Partial<HTMLInputElement> {
  initialEmoji?: string;
  where: any;
}

const Adder = forwardRef<"div", Props>((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;

  const [text, setText] = useState("");
  const actions = useActions();

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.target.value,
    setText,
  );

  const onAdd = (e: any) => {
    e.preventDefault();
    if (!text) return;

    try {
      actions.createTask(where.id, text);
    } catch (e) {
      console.error(e);
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
    }
  };

  return (
    <Input
      className={cn([
        "w-full border-gray-700 bg-gray-900 bg-opacity-80",
        props.className,
      ])}
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
