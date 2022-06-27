import { Box, Flex, Heading, List, ListItem, VStack } from "@chakra-ui/react";
import Adder from "../Adder";
import { ITask, useTasks } from "../data/useTasks";
import Rejected from "../Rejected";

const Bucket = () => {
  return (
    <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
      <Heading
        as="h1"
        onClick={() => {
          document.getElementById("bucket")?.scrollIntoView({
            behavior: "smooth",
          });
        }}
      >
        🪣Bucket
      </Heading>
      <BucketView />
      <Adder />
      <Rejected />
    </VStack>
  );
};

const BucketView = () => {
  const { bucket } = useTasks();

  return (
    <div id="bucket">
      <List spacing={2}>
        {bucket.map((task) => (
          <Task key={task.id} task={task} />
        ))}
      </List>
    </div>
  );
};

export default Bucket;

const Task = ({ task }: { task: ITask }) => {
  const { moveToToday } = useTasks();

  return (
    <ListItem background="gray.50" p={2} borderRadius="lg">
      <Flex justifyContent="space-between">
        <Box as="span">
          {task.title.emoji} {task.title.text}
        </Box>

        <Box onClick={() => moveToToday(task)} as="span" fontSize={16}>
          ⬆️
        </Box>
      </Flex>
    </ListItem>
  );
};
