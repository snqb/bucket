import {
  Accordion,
  Button,
  Flex,
  Heading,
  List,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";

const Bucket = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <VStack align="stretch" sx={{ minHeight: "90vh" }} py={4}>
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
      <Graveyard />
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
