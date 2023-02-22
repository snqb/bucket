import { Heading, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";
import Later from "../Later/Later";

const Today = () => {
  const today = useSyncedStore(store.today);

  return (
    <VStack
      spacing={12}
      minH="120%"
      pb="40vh"
      justify="space-between"
      align="stretch"
    >
      <VStack spacing={4} align="stretch">
        {today.map((task, index) => (
          <Task tabIndex={index} key={task.id} task={task} />
        ))}
        <Adder where="today" />
      </VStack>
      <VStack align="stretch" spacing={4}>
        <Heading textAlign="left" size="lg">
          🐼Later
        </Heading>
        <Later />
      </VStack>
    </VStack>
  );
};

export default Today;
