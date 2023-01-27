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
    <Box position="relative" pt="3vh">
      <VStack align="stretch" gap={4}>
        <Box>
          <Adder />
        </Box>
        <BucketView />

        <Flex mt="500px">
          <Graveyard />
        </Flex>

        <SyncInput />
      </VStack>
    </Box>
  );
};

const BucketView = () => {
  const state = useSyncedStore(store);

  const parent = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <div id="bucket">
      <Accordion allowToggle ref={parent as any}>
        {state.bucket
          .filter((it: Thingy) => it.residence !== "graveyard")
          .map((task, index) => {
            return <Task tabIndex={index} mb={2} key={task.id} task={task} />;
          })}
      </Accordion>
    </div>
  );
};

const SyncInput = () => {
  const [password, setPassword] = useState(
    localStorage.getItem("password") ?? ""
  );

  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  return (
    <Flex direction="column" gap={2} pb={5}>
      <FormControl>
        <FormLabel>Sync phrase</FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="sync phrase"
            onChange={(e) => {
              const value = e.target.value;

              if (value) {
                localStorage.setItem("password", e.target.value);
                setPassword(e.target.value);
              }
            }}
            value={password}
          />
          <InputRightElement w="3rem">
            <IconButton
              variant="solid"
              h="1.75rem"
              size="sm"
              icon={<>{show ? "🙉" : "🙈"}</>}
              onClick={handleClick}
              aria-label={"show or hide sync phrase"}
            />
          </InputRightElement>
        </InputGroup>
        <FormHelperText>
          use this phrase on your other device to sync bucket data via web-rtc
        </FormHelperText>
      </FormControl>
      <Button onClick={() => window.location.reload()}>start syncing</Button>
    </Flex>
  );
};

export default Bucket;
