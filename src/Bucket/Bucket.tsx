import { Accordion, Box, Flex, VStack } from "@chakra-ui/react";
import Adder from "../Adder";
import { ITask, useTasks } from "../data/useTasks";
import Graveyard from "../Graveyard";
import Task from "../Task";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import * as R from "ramda";
import { useCallback } from "react";
import { useMemo } from "preact/hooks";

const Bucket = () => {
  return (
    <Box position="relative" pt="3vh">
      <VStack align="stretch" gap={4}>
        <Box>
          <Adder />
        </Box>
        <BucketView />

        <Flex mt="500px">
          <Graveyard />
        </Flex>
      </VStack>
    </Box>
  );
};

const BucketView = () => {
  const { bucket } = useTasks();
  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  const sortOnceIfJustMoving = useMemo(
    () =>
      R.once(
        R.sortWith([
          R.ascend(R.prop("progress") as any),
          R.descend(R.prop("createdAt") as any),
        ])
      )(bucket),
    [bucket]
  );

  return (
    <div id="bucket">
      <Accordion allowToggle ref={parent as any}>
        {(sortOnceIfJustMoving as ITask[]).map((task, index) => (
          <Task tabIndex={index} mb={4} key={task.id} task={task} />
        ))}
      </Accordion>
    </div>
  );
};

export default Bucket;
