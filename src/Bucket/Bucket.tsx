import { VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";
import { BucketTask } from "../Task/BucketTask";

const Bucket = () => {
  const state = useSyncedStore(store);
  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack align="stretch" spacing={4} ref={autoAnimate as any}>
      {state.bucket.map((task, index) => {
        return <BucketTask tabIndex={index} key={task.id} task={task} />;
      })}
      <Adder where="bucket" />
    </VStack>
  );
};

export default Bucket;
