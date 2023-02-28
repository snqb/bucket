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
    <VStack minH="40vh" pb="30vh" spacing={4} align="stretch">
      {today.map((task, index) => (
        <Task tabIndex={index} key={task.id} task={task} />
      ))}
      <Adder where="today" />
    </VStack>
  );
};

export default Today;
