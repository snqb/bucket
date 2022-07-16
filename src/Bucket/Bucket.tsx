import {
  Button,
  Flex,
  Heading,
  List,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Rejected from "../Rejected";
import Task from "../Task";
import FlipMove from "react-flip-move";

const Bucket = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
      <Flex justify="space-between" alignItems="center">
        <Heading
          userSelect="none"
          as="h1"
          onClick={() => {
            document.getElementById("bucket")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          🪣 Bucket
        </Heading>
        <Button variant="outline" size="xs" onClick={toggleColorMode}>
          {colorMode === "light" ? "🌙" : "🌞"}
        </Button>
      </Flex>

      <BucketView />
      <Adder />
      <Rejected />
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
