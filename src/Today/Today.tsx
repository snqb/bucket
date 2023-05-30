import { Heading, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";

const Today = () => {
  const today = useSyncedStore(store.today);
  const [parent] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack justify="space-between" align="stretch">
      <Adder w="full" placeholder="slower things..." where="today" />
      <VStack spacing={3} align="stretch" ref={parent as any}>
        {today.map((task, index) => (
          <Task key={task.id} task={task} />
        ))}
      </VStack>
    </VStack>
  );
};

export default Today;
