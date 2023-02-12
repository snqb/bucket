import { Accordion, Button, Flex, List, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store } from "../store";

const Today = () => {
  return <TodayView />;
};

const TodayView = () => {
  const today = useSyncedStore(store.today);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });
  const hasDone = today.some((task) => task.progress === 100);

  return (
    <>
      <Flex
        h="100%"
        mt="20vh"
        ref={parent as any}
        gap={5}
        direction="column"
        pb="20vmin"
      >
        {hasDone && (
          <Button
            w="fit-content"
            colorScheme="red"
            variant="ghost"
            ml="auto"
            fontSize="x-large"
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
            🗑️
          </Button>
        )}
        {today.map((task, index) => (
          <Task tabIndex={index} key={task.id} task={task} />
        ))}
      </Flex>
    </>
  );
};

export default Today;
