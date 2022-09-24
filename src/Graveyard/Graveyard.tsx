import { Box, Flex, List, ListItem, Text } from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

const Graveyard = () => {
  const { graveyard } = useTasks();

  return (
    <Box mt={10}>
      <Box filter="blur(1px)" py={5}>
        <Text mt={2} userSelect="none" as="h4" size="lg">
          🪦 🪦 🪦
        </Text>
        <List spacing={2}>
          {graveyard.map((task) => (
            <Task key={task.id} task={task} />
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Graveyard;

const Task = ({ task }: { task: ITask }) => {
  return (
    <ListItem>
      <Flex justifyContent="space-between">
        <Box as="span">
          {task.title.emoji}
          {task.title.text}
        </Box>
      </Flex>
    </ListItem>
  );
};
