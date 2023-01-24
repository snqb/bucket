import {
  Accordion,
  Box, VStack
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Adder from "../Adder";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store } from "../store";

const Today = () => {
  return (
    <Box position="relative" pt="3vh">
      <VStack align="stretch" gap={4}>
        <Box>
          <Adder where="today" />
        </Box>
        <TodayView />
      </VStack>
    </Box>
  );
};

const TodayView = () => {
  const today = useSyncedStore(store.today);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <div id="Today">
      <Accordion allowToggle ref={parent as any}>
        {today.map((task, index) => {
          return (
            <Task
              where="today"
              tabIndex={index}
              mb={4}
              key={task.id}
              task={task}
            />
          );
        })}
      </Accordion>
    </div>
  );
};

export default Today;
