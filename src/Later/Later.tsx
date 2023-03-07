import { VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { LaterTask } from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { useInView } from "react-intersection-observer";
import Adder from "../Adder";
import { store } from "../store";

const Later = () => {

  const later = useSyncedStore(store.later);

  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack
      id="later"
      gap={2}
      align="stretch"
      ref={autoAnimate as any}
    >
      <Adder placeholder="anything that is not now" where="later" />

      {later.map((task, index) => (
        <LaterTask tabIndex={index} key={task.id} task={task} />
      ))}
    </VStack>
  );
};

export default Later;
