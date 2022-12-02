import { Accordion, Box, Flex, VStack } from "@chakra-ui/react";
import Adder from "../Adder";
import { ITask, useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const Bucket = () => {
  return (
    <Box position="relative" pt="5vh">
      <VStack align="stretch" gap={4}>
        <Box>
          <Adder />
        </Box>
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
  const parent = useAutoAnimate({ duration: 160, easing: "linear" });

  return (
    <div id="bucket">
      <Accordion allowToggle ref={parent as any}>
        {(bucket as any).map((task: ITask, index: number) => (
          <Task tabIndex={index} mb={4} key={task.id} task={task} />
        ))}
      </Accordion>
    </div>
  );
};

export default Bucket;
