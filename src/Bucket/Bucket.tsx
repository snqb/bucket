import {
  Accordion,
  Button,
  Center,
  Flex,
  Heading,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";

const Bucket = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { tasks, today } = useTasks();

  return (
    <VStack justify="end" align="stretch" sx={{ minHeight: "75vh" }} py={4}>
      <Flex direction="column" justify="end">
        {tasks.length === 0 && <Empty />}

        <Flex justify="space-between" alignItems="center">
          <Heading userSelect="none" as="h1" mb={5}>
            🪣 Bucket
          </Heading>
          <Button variant="outline" size="xs" onClick={toggleColorMode}>
            {colorMode === "light" ? "🌙" : "🌞"}
          </Button>
        </Flex>

        <BucketView />
        <Adder />
      </Flex>

      {/* <Graveyard /> */}
    </VStack>
  );
};

const BucketView = () => {
  const { bucket, today } = useTasks();
  console.log(bucket.length);

  return (
    <div id="bucket">
      <Accordion allowToggle>
        {bucket.map((task) => (
          <Task mb={3} key={task.id} task={task} />
        ))}
      </Accordion>
    </div>
  );
};

export default Bucket;

const Empty = () => {
  return (
    <Flex m={10} direction="column" textAlign="center">
      <Text fontSize="6xl">YES</Text>
      <Text fontSize="6xl">IT'S</Text>
      <Text fontSize="6xl">UPSIDE</Text>
      <Text fontSize="6xl">DOWN🙄</Text>
      <Text fontSize="6xl">👇</Text>
    </Flex>
  );
};
