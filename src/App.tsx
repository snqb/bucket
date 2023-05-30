import {
  Flex,
  Heading,
  HStack,
  Spacer,
  StackDivider,
  VStack,
} from "@chakra-ui/react";

import { useEffect, useRef, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";
import Today from "./Today";

import Later from "./Later";
import Bucket from "./Bucket";
import { Clean } from "./@components/Clean";

function App() {
  return (
    <Flex px={[5, 5, 10, 20, 300]} pt={12} pb={128} maxW="500px">
      <VStack
        mt="24vh"
        spacing={16}
        divider={<StackDivider />}
        align="stretch"
        w="full"
        minH="100vh"
      >
        <VStack align="stretch" minH="30vh" spacing={8}>
          <Heading size="2xl">Short</Heading>
          <Later />
        </VStack>

        <VStack align="stretch" minH="30vh" spacing={8}>
          <HStack justify="space-between">
            <Heading size="2xl">Long</Heading>
            <Clean what="today" />
          </HStack>

          <Today />
        </VStack>

        <VStack align="stretch" minH="30vh" spacing={8}>
          <HStack justify="space-between">
            <Heading size="2xl">Bucket</Heading>
            <Clean what="bucket" />
          </HStack>
          <Bucket />
        </VStack>
      </VStack>
      <ReloadPrompt />
    </Flex>
  );
}

export default App;

const usePersistedTab = () => {
  const tabState = useState(Number(localStorage.getItem("current-tab")) ?? 0);

  const [tab, setTab] = tabState;

  useEffect(() => {
    localStorage.setItem("current-tab", tab.toString());
  }, [tab]);

  return tabState;
};
