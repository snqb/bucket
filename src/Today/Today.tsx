import { Heading, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import Later from "../Later/Later";
import { store } from "../store";

const Today = () => {
  const today = useSyncedStore(store.today);
  const [parent] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack justify="space-between" minH="100%" pb="30vh" align="stretch">
      <VStack minH="60vh" spacing={6} align="stretch" ref={parent as any}>
        {today.map((task, index) => (
          <Task tabIndex={index} key={task.id} task={task} />
        ))}
        <Adder mb={5} placeholder="now/today/any/even tomorrow" where="today" />
      </VStack>
      <VStack
        _focusWithin={{
          filter: "none",
        }}
        filter="blur(2px)"
        align="stretch"
        spacing={4}
      >
        <Heading textAlign="left" size="lg">
          ❓Later
        </Heading>
        <Later />
      </VStack>
    </VStack>
  );
};

export default Today;
