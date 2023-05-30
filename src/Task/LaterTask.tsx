import {
  AccordionItemProps,
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import cloneDeep from "lodash.clonedeep";

import { store, Thingy } from "../store";

interface Props extends AccordionItemProps {
  task: Thingy;
}

export const LaterTask = ({ task, ...restItemProps }: Props) => {
  const state = useSyncedStore(store);

  const onUpClick = () => {
    const _task = cloneDeep(state.later.find((it) => it.id === task.id));
    const position = state.later.findIndex((it) => it.id === task.id);
    state.later.splice(position, 1);
    console.log(cloneDeep(task));

    state.today.push(_task!);
  };

  const onLeftClick = () => {
    const _task = cloneDeep(task);
    const position = state.later.findIndex((it) => it.id === task.id);
    state.later.splice(position, 1);

    state.bucket.push(_task);
  };

  const onRemoveClick = () => {
    const position = state.later.findIndex((it) => it.id === task.id);
    state.later.splice(position, 1);
  };

  return (
    <VStack
      align="start"
      p={0}
      userSelect="none"
      {...restItemProps}
      spacing={0}
    >
      <HStack w="full" align="baseline" justify="space-between">
        <Box w="100%" textAlign="left" as="span" fontSize="xl" fontWeight={500}>
          {task.title.emoji}
          {task.title.text}
        </Box>
        <Button
          variant="outline"
          size="xs"
          fontSize="md"
          fontWeight="bold"
          onClick={onRemoveClick}
          filter="saturate(0)"
        >
          ❌
        </Button>
      </HStack>
      <ButtonGroup variant="outline" size="lg" w="full">
        {/* <Button
          variant="outline"
          size="xs"
          fontSize="md"
          fontWeight="bold"
          w="full"
          onClick={onUpClick}
        >
          🏄‍♂️↑
        </Button> */}
      </ButtonGroup>
    </VStack>
  );
};
