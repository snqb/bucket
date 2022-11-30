import { Accordion, Box, Flex, VStack } from "@chakra-ui/react";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const Bucket = () => {
  return (
    <Box position="relative">
      <VStack align="stretch" py={2}>
        <BucketView />
        <Adder />

        <Flex mt="500px">
          <Graveyard />
        </Flex>
      </VStack>
    </Box>
  );
};

const BucketView = () => {
  const { bucket } = useTasks();
  const parent = useAutoAnimate({ duration: 100, easing: "ease-out" });

  return (
    <div id="bucket">
      <Accordion allowToggle ref={parent as any}>
        {bucket.map((task, index) => (
          <Task tabIndex={index} mb={4} key={task.id} task={task} />
        ))}
      </Accordion>
    </div>
  );
};

export default Bucket;
