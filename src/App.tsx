import {
  Box,
  Button,
  Flex,
  Heading,
  StyleProps,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import * as R from "ramda";
import { PropsWithChildren, useEffect, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";
import { store } from "./store";
import Today from "./Today";

import { useSyncedStore } from "@syncedstore/react";
import Later from "./Later";

const panelStyles: StyleProps = {
  h: "100%", // so that it fills the whole screen
  p: 2,
  pb: "40vh",
};

localStorage.setItem("log", "y-webrtc");

function App() {
  const [tab, setTab] = usePersistedTab();
  const today = useSyncedStore(store.today);
  const hasDone = today.some((task) => task.progress === 100);

  return (
    <Flex
      px={[2, 5, 10, 20, 300]}
      py={[4, 1, 1, 1, 1, 10]}
      direction="column"
      scrollBehavior="smooth"
    >
      <Tabs
        orientation="vertical"
        px={0}
        variant="soft-rounded"
        index={tab}
        onChange={setTab}
        align="center"
      >
        <TabList
          position="fixed"
          maxHeight="30vh"
          top="69%"
          borderLeftRadius="30%"
          p={3}
          right={0}
          zIndex={2}
          bottom="0"
          bg="blackAlpha.800"
        >
          <Tab>
            <Heading size="lg">🪣</Heading>
          </Tab>
          <Tab>
            <Heading size="lg">❓</Heading>
          </Tab>
          <Tab mb={6}>
            <Heading size="lg">🏄‍♂️</Heading>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel {...panelStyles}>
            <HeadingSection title="Bucket" emoji="🪣" />
            <Bucket />
          </TabPanel>

          <TabPanel {...panelStyles}>
            <HeadingSection title="Later" emoji="❓">
              <Clean all what="later" />
            </HeadingSection>
            <Later />
          </TabPanel>

          <TabPanel {...panelStyles}>
            <HeadingSection title="Today" emoji="🏄‍♂️">
              {hasDone && <Clean what="today" />}
            </HeadingSection>
            <Today />
          </TabPanel>
        </TabPanels>
      </Tabs>
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

const HeadingSection = ({
  title,
  emoji,
  children,
}: PropsWithChildren<{ title: string; emoji: string }>) => {
  return (
    <Flex
      bg="black"
      w="full"
      align="center"
      justify="space-between"
      position="sticky"
      top={0}
      p={1}
      mb={4}
      zIndex={3}
    >
      <Heading bg="black" size="xl" textAlign="left">
        <EmojiThing>{emoji}</EmojiThing>
        {title}
      </Heading>
      <Box>{children}</Box>
    </Flex>
  );
};

const EmojiThing = ({ children }: PropsWithChildren) => {
  return (
    <Box fontSize="xl" as="span">
      {children}&nbsp;
    </Box>
  );
};

const Clean = ({
  what,
  all = false,
}: {
  what: keyof typeof store;
  all?: boolean;
}) => {
  const where = useSyncedStore(store[what]);

  return (
    <Button
      w="fit-content"
      variant="ghost"
      ml="auto"
      fontSize="x-large"
      bg="blackAlpha.900"
      onClick={() => {
        const cleanup = () => {
          if (all) {
            where.splice(0, where.length);
          } else {
            const doneIndex = R.findIndex(R.propEq("progress", 100))(where);
            if (doneIndex === -1) {
              return;
            }

            // we recursively delete them because syncedstore doesn't support `filter`, as we have to mutate
            where.splice(doneIndex, 1);
            cleanup();
          }
        };

        cleanup();
      }}
    >
      🚮
    </Button>
  );
};
