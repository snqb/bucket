import { VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { LaterTask } from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";

const Later = () => {
  const later = useSyncedStore(store.later);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack id="later" gap={2} align="stretch">
      <Adder where="later" />

      {later.map((task, index) => (
        <LaterTask tabIndex={index} key={task.id} task={task} />
      ))}
    </VStack>
  );
};

export default Later;
