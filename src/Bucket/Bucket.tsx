import { Accordion, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store, Thingy } from "../store";
import { BucketTask } from "../Task/BucketTask";
import Adder from "../Adder";

const Bucket = () => {
  const state = useSyncedStore(store);
  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <Accordion allowToggle>
      <VStack align="stretch">
        {state.bucket
          .filter((it: Thingy) => it.residence !== "graveyard")
          .map((task, index) => {
            return <BucketTask tabIndex={index} key={task.id} task={task} />;
          })}
        <Adder where="bucket" />
      </VStack>
    </Accordion>
  );
};

export default Bucket;
