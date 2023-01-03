import { Box, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { store, Thingy } from "../store";

const Graveyard = () => {
  const state = useSyncedStore(store);
  const graveyard = state.bucket.filter((it) => it.residence === "graveyard");

  const { isOpen, onToggle } = useDisclosure();
  const isClosed = !isOpen;

  if (graveyard.length < 1) {
    return null;
  }

  return (
    <Box filter={isClosed ? "blur(1px)" : "initial"} py={5}>
      <Heading my={2} userSelect="none" as="h4" size="lg" onClick={onToggle}>
        {isClosed ? "🙈" : "🙉"} Graveyard
      </Heading>
      <Flex wrap="wrap" gap={3} justify="center">
        {graveyard.map((task: Thingy) => (
          <Task key={task.id} task={task} />
        ))}
      </Flex>
    </Box>
  );
};

export default Graveyard;

const Task = ({ task }: { task: Thingy }) => {
  console.log(task)
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
