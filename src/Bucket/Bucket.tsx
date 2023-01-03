import { Accordion, Box, Flex, VStack } from "@chakra-ui/react";
import Adder from "../Adder";
import Graveyard from "../Graveyard";
import Task from "../Task";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { useSyncedStore } from "@syncedstore/react";

import * as R from "ramda";
import { useCallback } from "react";
import { useMemo } from "preact/hooks";
import { store } from "../store";

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
  const state = useSyncedStore(store);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  console.log(state.bucket.forEach(console.log));

  // const sortOnceIfJustMoving = useMemo(
  //   () =>
  //     R.once(
  //       R.sortWith([
  //         R.ascend(R.prop("progress") as any),
  //         R.descend(R.prop("createdAt") as any),
  //       ])
  //     )(bucket),
  //   [bucket]
  // );

  return (
    <div id="bucket">
      <Accordion allowToggle ref={parent as any}>
        {state.bucket.map((task, index) => {
          return <Task tabIndex={index} mb={4} key={task.id} task={task} />;
        })}
        {/* {(sortOnceIfJustMoving as ITask[]).map((task, index) => (
          <Task tabIndex={index} mb={4} key={task.id} task={task} />
        ))} */}
      </Accordion>
    </div>
  );
};

export default Bucket;
