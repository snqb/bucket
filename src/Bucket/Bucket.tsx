import { Accordion, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store, Thingy } from "../store";

const Bucket = () => {
  return (
    <VStack h="100%" justify="flex-end" align="stretch" gap={4} pt="2vh">
      <BucketView />

      {/* <Flex mt="500px">
        <Graveyard />
      </Flex> */}
    </VStack>
  );
};

const BucketView = () => {
  const state = useSyncedStore(store);
  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <Accordion
      justifyContent="flex-end"
      allowToggle
      ref={parent as any}
      reduceMotion
    >
      {state.bucket
        .filter((it: Thingy) => it.residence !== "graveyard")
        .map((task, index) => {
          return <Task tabIndex={index} mb={2} key={task.id} task={task} />;
        })}
    </Accordion>
  );
};

export default Bucket;
