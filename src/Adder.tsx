import {
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  forwardRef,
} from "@chakra-ui/react";
import { ChangeEventHandler, useState } from "react";

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
export interface Props extends InputGroupProps {
  initialEmoji?: string;
  where?: keyof TodoState;
}

const Adder = forwardRef<Props, "div">((props, ref) => {
  const { placeholder, initialEmoji = "+", where, ...inputGroupProps } = props;
  const dispatch = useAppDispatch();
  const [row, column] = position$.get();
  const structure = useAppSelector((state) => state.todo.structure);

  const [text, setText] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = R.pipe(
    (e) => e.target.value,
    setText
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
        })
      );
    } catch (e) {
      console.error(e);
      alert("dev is stupid, text him t.me/snqba");
    } finally {
      setText("");
    }
  };

  return (
    <InputGroup
      ref={ref}
      variant="outline"
      opacity={0.9}
      borderRadius="4px"
      size="md"
      boxShadow={`inset 0 0 0.5px 1px hsla(0, 0%,  
        100%, 0.075),
        /* shadow ring 👇 */
        0 0 0 5px hsla(0, 0%, 0%, 0.05),
        /* multiple soft shadows 👇 */
        0 0.3px 0.4px hsla(0, 0%, 0%, 0.02),
        0 0.9px 1.5px hsla(0, 0%, 0%, 0.045),
        0 3.5px 6px hsla(0, 0%, 0%, 0.09);`}
      {...inputGroupProps}
    >
      <InputLeftElement>
        <span>{R.isEmpty(text) ? "👊" : getRandomEmoji(text)}</span>
      </InputLeftElement>
      <Input
        enterKeyHint="done"
        colorScheme="blue"
        type="text"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onBlur={onAdd}
        onKeyDown={R.when((e) => e.key === "Enter", onAdd)}
        bg="gray.900"
        placeholder={props.placeholder}
      />
    </InputGroup>
  );
});

export default Adder;
