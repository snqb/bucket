import { Accordion, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store, Thingy } from "../store";
import { BucketTask } from "../Task/BucketTask";

const Bucket = () => {
  return (
    <VStack h="100%" align="stretch" gap={4} pb="3vh">
      <BucketView />
    </VStack>
  );
};

const BucketView = () => {
  const state = useSyncedStore(store);
  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <Accordion
      allowToggle
      reduceMotion
      overflowY="auto"
      overflowX="hidden"
    >
      {state.bucket
        .filter((it: Thingy) => it.residence !== "graveyard")
        .map((task, index) => {
          return (
            <BucketTask tabIndex={index} mb={4} key={task.id} task={task} />
          );
        })}
    </Accordion>
  );
};

export default Bucket;
