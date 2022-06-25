import { Box, Divider, Flex, List, ListItem } from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

const Rejected = () => {
  const { rejected } = useTasks();

  return (
    <Box mt={10}>
      <Divider variant="dashed" />
      <Box filter="blur(1px)" py={5}>
        <List spacing={2}>
          {rejected.map((task) => (
            <Task key={task.id} task={task} />
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Rejected;

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
