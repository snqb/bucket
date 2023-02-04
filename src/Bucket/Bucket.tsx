import {
  Accordion,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Adder from "../Adder";
import Graveyard from "../Graveyard";
import Task from "../Task";

import { useSyncedStore } from "@syncedstore/react";

import { IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { store, Thingy } from "../store";

const Bucket = () => {
  return (
    <Box position="relative" pt="2vh">
      <VStack align="stretch" gap={4}>
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

  return (
    <Accordion allowToggle ref={parent as any} reduceMotion>
      {state.bucket
        .filter((it: Thingy) => it.residence !== "graveyard")
        .map((task, index) => {
          return <Task tabIndex={index} mb={2} key={task.id} task={task} />;
        })}
    </Accordion>
  );
};

export default Bucket;
