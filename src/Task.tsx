import {
  AccordionItemProps,
  Box,
  Button,
  HStack,
  VStack,
} from "@chakra-ui/react";

import { Todo, TodoState, removeTask, useAppDispatch } from "./newStore";

interface Props extends AccordionItemProps {
  task: Todo;
  where: keyof TodoState;
}

export const ShortTask = ({ task, where, ...restItemProps }: Props) => {
  const dispatch = useAppDispatch();
  const onRemoveClick = () => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      }),
    );
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
          variant="ghost"
          size="xs"
          fontSize="md"
          fontWeight="bold"
          onClick={onRemoveClick}
          filter="saturate(0)"
        >
          ❌
        </Button>
      </HStack>
    </VStack>
  );
};
