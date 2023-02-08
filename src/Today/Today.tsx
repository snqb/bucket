import { Accordion, Button, List, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store } from "../store";

const Today = () => {
  return (
    <VStack h="100%" align="stretch" pb="3vh">
      <TodayView />
    </VStack>
  );
};

const TodayView = () => {
  const today = useSyncedStore(store.today);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });
  const hasDone = today.some((task) => task.progress === 100);

  return (
    <>
      <List ref={parent as any} spacing={8} overflowY="auto" overflowX="hidden">
        {today.map((task, index) => (
          <Task tabIndex={index} mb={4} key={task.id} task={task} />
        ))}
      </List>

      {hasDone && (
        <Button
          w="full"
          colorScheme="red"
          variant="outline"
          h="50px"
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
    </>
  );
};

export default Today;
