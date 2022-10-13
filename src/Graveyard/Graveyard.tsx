import { Box, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

const Graveyard = () => {
  const { graveyard } = useTasks();
  const { isOpen, onToggle } = useDisclosure();
  const isClosed = !isOpen;

  return (
    <Box filter={isClosed ? "blur(1px)" : "initial"} py={5}>
      <Heading my={2} userSelect="none" as="h4" size="lg" onClick={onToggle}>
        {isClosed ? "🙈" : "🙉"} Graveyard
      </Heading>
      <Flex wrap="wrap" gap={3} justify="center">
        {graveyard.map((task) => (
          <Task key={task.id} task={task} />
        ))}
      </Flex>
    </Box>
  );
};

export default Graveyard;

const Task = ({ task }: { task: ITask }) => {
  return (
    <Flex m={2} direction="column" align="center" justify="center" gap={0.75}>
      <Heading as="h6" fontSize="2xl">
        {task.title.emoji}
      </Heading>
      <Text fontSize="small">
        {new Date(task.createdAt).toLocaleDateString()}-?
      </Text>
      <Text fontStyle="oblique">{task.title.text}</Text>
    </Flex>
  );
};
