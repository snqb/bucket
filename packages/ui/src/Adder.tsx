import { ChangeEventHandler, forwardRef, useState } from "react";

import { Input } from "./components/ui/input";
import { useActions } from "@bucket/core";
import { cn } from "./lib/utils";
import type { List } from "@bucket/core";

export interface Props extends Partial<HTMLInputElement> {
  initialEmoji?: string;
  where: List;
}

const Adder = forwardRef<"div", Props>((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;

  const [text, setText] = useState("");
  const [error, setError] = useState<string>("");
  const actions = useActions();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setText(e.target.value);
    if (error) setError(""); // Clear error on new input
  };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      actions.createTask(where.id, text.trim());
      setText("");
      setError("");
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Failed to create task. Please try again.");
      setTimeout(() => setError(""), 3000); // Clear after 3s
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAdd(e);
    }
  };

  return (
    <div className="relative">
      <Input
        className={cn([
          "w-full border-gray-700 bg-gray-900 bg-opacity-80",
          error && "border-red-500",
          props.className,
        ])}
        enterKeyHint="done"
        type="text"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={onAdd}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder ?? "Add a task..."}
        aria-label="Add new task"
        aria-invalid={!!error}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Adder;
