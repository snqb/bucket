import { Heading, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import Later from "../Later/Later";
import { store } from "../store";
import { Empty } from "../@components/Empty";

const Today = () => {
  const today = useSyncedStore(store.today);
  const [parent] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <VStack justify="space-between" align="stretch">
      <Adder
        variant="filled"
        w="full"
        placeholder="slower things..."
        where="today"
        // display="contents"
      />
      <VStack spacing={3} align="stretch" ref={parent as any}>
        {today.map((task, index) => (
          <Task tabIndex={index} key={task.id} task={task} />
        ))}
        <Empty what="today" />
      </VStack>
    </VStack>
  );
};

export default Today;
