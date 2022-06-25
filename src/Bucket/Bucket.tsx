import { Box, Flex, List, ListItem } from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

const Bucket = () => {
  const { bucket } = useTasks();

  return (
    <div id="bucket">
      <List spacing={2}>
        {bucket.map((task) => (
          <Task task={task} />
        ))}
      </List>
    </div>
  );
};

export default Bucket;

const Task = ({ task }: { task: ITask }) => {
  const { moveToToday } = useTasks();

  return (
    <ListItem background="gray.50" p={2} borderRadius="lg" >
      <Flex justifyContent="space-between">
        <Box as="span">
          {task.title.emoji}
          {task.title.text}
        </Box>

        <Box onClick={() => moveToToday(task)} as="span" fontSize={16}>
          ⬆️
        </Box>
      </Flex>
    </ListItem>
  );
};
