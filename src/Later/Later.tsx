import {
  Heading,
  Skeleton,
  SkeletonText,
  StackDivider,
  VStack,
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { LaterTask } from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";

const Later = () => {
  const later = useSyncedStore(store.later);

  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack
      spacing={4}
      id="later"
      align="stretch"
      divider={<StackDivider borderColor="gray.800" />}
      ref={autoAnimate as any}
    >
      {later.length === 0 && (
        <VStack align="stretch">
          <Skeleton h="48px" />
        </VStack>
      )}
      {later.map((task, index) => (
        <LaterTask tabIndex={index} key={task.id} task={task} />
      ))}
      <Adder placeholder="anything that is not now" where="later" />
    </VStack>
  );
};

export default Later;
