import { Accordion, Button, Flex, List, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { store } from "../store";
import Adder from "../Adder";

const Today = () => {
  const today = useSyncedStore(store.today);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });
  const hasDone = today.some((task) => task.progress === 100);

  return (
    <>
      <VStack ref={parent as any} gap={2} align="stretch">
        {today.map((task, index) => (
          <Task tabIndex={index} key={task.id} task={task} />
        ))}
        <Adder where="today" />
      </VStack>
      {hasDone && (
        <Button
          position="absolute"
          top={5}
          right={5}
          w="fit-content"
          variant="ghost"
          ml="auto"
          fontSize="x-large"
          h="50px"
          bg="blackAlpha.900"
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
    </>
  );
};

export default Today;
