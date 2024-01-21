import {
  Input,
  InputGroup,
  InputGroupProps,
  InputLeftElement,
  forwardRef,
} from "@chakra-ui/react";
import { ChangeEventHandler, useContext, useState } from "react";

import * as R from "ramda";
import { CoordinatesContext } from "./App";
import { Plusik } from "./Plusik";
import { getRandomEmoji } from "./emojis";
import {
  TodoState,
  addTask,
  renameScreen,
  useAppDispatch,
  useAppSelector,
  type Todo,
} from "./store";
export interface Props extends InputGroupProps {
  what: "task" | "screen";
  initialEmoji?: string;
  where?: keyof TodoState;
}

const Adder = forwardRef<Props, "div">((props, ref) => {
  const {
    placeholder,
    what = "task",
    initialEmoji = "+",
    where,
    ...inputGroupProps
  } = props;
  const dispatch = useAppDispatch();
  const [row, column] = useContext(CoordinatesContext);
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
      if (what === "task") {
        const destination = where ?? structure[row][column];

        dispatch(
          addTask({
            key: destination,
            task,
            coords: [row, column],
          })
        );
      } else if (what === "screen") {
        dispatch(renameScreen({ title: text, coords: [row, column] }));
      }
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
        {text.length === 0 ? (
          <Plusik isActive>{"👊"}</Plusik>
        ) : (
          <span>{getRandomEmoji(text)}</span>
        )}
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
