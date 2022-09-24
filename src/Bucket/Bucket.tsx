import {
  Button,
  Flex,
  Heading,
  List,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import FlipMove from "react-flip-move";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";

const Bucket = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
      <Flex justify="space-between" alignItems="center">
        <Heading userSelect="none" as="h1">
          🪣 Bucket
        </Heading>
        <Button variant="outline" size="xs" onClick={toggleColorMode}>
          {colorMode === "light" ? "🌙" : "🌞"}
        </Button>
      </Flex>

      <BucketView />
      <Adder />
      <Graveyard />
    </VStack>
  );
};

const BucketView = () => {
  const { bucket, today } = useTasks();

  return (
    <div id="bucket">
      <List spacing={2}>
        {/* @ts-ignore */}
        <FlipMove>
          {today.map((task) => (
            <Task mb={2} highlighted key={`today-${task.id}`} task={task} />
          ))}
          {bucket.map((task) => (
            <Task mb={2} key={task.id} task={task} />
          ))}
        </FlipMove>
      </List>
    </div>
  );
};

export default Bucket;
