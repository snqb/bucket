import { Accordion, Box, Flex, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Adder from "../Adder";
import Graveyard from "../Graveyard";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store, Thingy } from "../store";

const Bucket = () => {
  return (
    <Box position="relative" pt="3vh">
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
  const state = useSyncedStore(store);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <div id="bucket">
      <Accordion allowToggle ref={parent as any}>
        {state.bucket
          .filter((it: Thingy) => it.residence !== "graveyard")
          .map((task, index) => {
            return <Task tabIndex={index} mb={4} key={task.id} task={task} />;
          })}
      </Accordion>
    </div>
  );
};

export default Bucket;
