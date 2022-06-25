import { Box, Divider, Flex, List, ListItem } from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

const Rejected = () => {
  const { rejected } = useTasks();

  return (
    <>
      <Divider variant="dashed" pt={6} />
      <Box filter="blur(1px)">
        <List spacing={2}>
          {rejected.map((task) => (
            <Task key={task.id} task={task} />
          ))}
        </List>
      </Box>
    </>
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
