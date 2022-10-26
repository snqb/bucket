import {
  Accordion,
  Box, Flex, IconButton, VStack
} from "@chakra-ui/react";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";

const Bucket = () => {
  return (
    <Box position="relative">
      <VStack minH="100vh" align="stretch" py={4}>
        <BucketView />
        <Adder />
        <Flex mt="500px">
          <Graveyard />
        </Flex>
      </VStack>
      <IconButton
        icon={<>🏃‍♀️</>}
        isRound
        variant="outline"
        size="lg"
        onClick={() => {
          const adder = document?.querySelector("#adder");
          if (adder) {
            adder.scrollIntoView();
            (adder as any).focus();
          }
        }}
        opacity="0.5"
        position="fixed"
        bottom="45"
        right="10"
        aria-label="add quickly"
      />
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
