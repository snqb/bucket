import { ChangeEventHandler, forwardRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as R from "ramda";
import { pb } from "./App";
import { Input } from "./components/ui/input";
import { TodoState } from "./store";
export interface Props extends Partial<HTMLInputElement> {
  initialEmoji?: string;
  where: keyof TodoState;
  collectionId: string;
}

const Adder = forwardRef<"div", Props>((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;
  const client = useQueryClient();
  const [text, setText] = useState("");

  const add = useMutation({
    mutationFn: async (text: string) => {
      const task = await pb.collection("tasks").create({
        title: text,
        screen: props.collectionId,
        author: [pb.authStore.model!.id],
      });
      return task;
    },
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["task", where],
      });
    },
  });

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.target.value,
    setText,
  );

  const onAdd = (e: any) => {
    e.preventDefault();
    if (!text) return;

    try {
      add.mutate(text);
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
