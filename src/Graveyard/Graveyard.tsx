import { Box, Flex, List, ListItem, Text } from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";
import * as R from "ramda";

const random = R.curry((min: number, max: number) => {
  const range = max - min;
  const random = Math.random() * range + min;
  return Math.floor(random);
});

const Graveyard = () => {
  const { graveyard } = useTasks();

  return (
    <Box >
      <Box filter="blur(1px)" py={5}>
        <Text my={2} userSelect="none" as="h4" size="lg">
          🪦 🪦 🪦
        </Text>
        <Flex wrap="wrap" gap={5}>
          {graveyard.map((task) => (
            <Task key={task.id} task={task} />
          ))}
        </Flex>
      </Box>
    </Box>
  );
};

export default Graveyard;

const Task = ({ task }: { task: ITask }) => {
  return (
    <Box mr={random(8, 16)} as="span">
      {task.title.emoji}
      {task.title.text}
    </Box>
  );
};
