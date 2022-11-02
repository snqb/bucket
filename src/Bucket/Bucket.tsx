import { Accordion, Box, Flex, VStack } from "@chakra-ui/react";
import { useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";

const Bucket = () => {
  return (
    <Box position="relative">
      <VStack align="stretch" py={2}>
        <BucketView />

        <Flex mt="500px">
          <Graveyard />
        </Flex>
      </VStack>
    </Box>
  );
};

const BucketView = () => {
  const { bucket } = useTasks();

  return (
    <div id="bucket">
      <Accordion allowToggle>
        {bucket.map((task, index) => (
          <Task tabIndex={index} mb={4} key={task.id} task={task} />
        ))}
      </Accordion>
    </div>
  );
};

export default Bucket;
