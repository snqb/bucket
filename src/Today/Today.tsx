import { Accordion, Box, Button, VStack } from "@chakra-ui/react";
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
  const hasDone = today.some((task) => task.progress === 100);

  return (
    <div id="Today">
      <Accordion allowToggle ref={parent as any} reduceMotion>
        {today.map((task, index) => {
          return (
            <Task
              where="today"
              tabIndex={index}
              mb={2}
              key={task.id}
              task={task}
            />
          );
        })}
      </Accordion>
      {hasDone && (
        <Button
          w="full"
          colorScheme="red"
          onClick={() => {
            const cleanup = () => {
              const doneIndex = today.findIndex((it) => it.progress === 100);
              if (doneIndex < 0) {
                return;
              }

              // we recursively delete them because syncedstore doesn't support `filter`, as we have to mutate
              today.splice(doneIndex, 1);
              cleanup();
            };

            cleanup();
          }}
        >
          🔪 Clear
        </Button>
      )}
    </div>
  );
};

export default Today;
