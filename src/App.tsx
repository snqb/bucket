import {
  Box,
  Flex,
  Heading,
  IconButton,
  StyleProps,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import { useEffect, useState } from "react";
import { usePageVisibility } from "react-page-visibility";
import Adder from "./Adder";
import ReloadPrompt from "./ReloadPrompt";
import { webrtcProvider } from "./store";
import { SyncInput } from "./SyncInput";
import Today from "./Today";

const panelStyles: StyleProps = {
  h: "100%", // so that it fills the whole screen
  overflowY: "auto", // tasks inside should be scrollable
  p: 2,
  pb: "40vh",
};

localStorage.setItem("log", "y-webrtc");

function App() {
  const [tab, setTab] = usePersistedTab();
  const connected = useRtcConnectionShit();

  return (
    <Flex px={[2, 5, 10, 20, 300]} py={[4, 1, 1, 1, 1, 10]} direction="column">
      <Tabs
        orientation="vertical"
        px={0}
        variant="soft-rounded"
        index={tab}
        onChange={setTab}
        align="center"
      >
        <TabPanels>
          <TabPanel {...panelStyles}>
            <Heading size="xl" mb={4} textAlign="left">
              <Box fontSize="xl" as="span">
                🪣&nbsp;
              </Box>
              Bucket
            </Heading>
            <Bucket />
          </TabPanel>

          <TabPanel {...panelStyles}>
            <Heading size="xl" mb={4} textAlign="left">
              <Box fontSize="xl" as="span">
                🏄&nbsp;
              </Box>
              Today
            </Heading>
            <Today />
          </TabPanel>
          <TabPanel>
            <Heading size="xl" mb={4} textAlign="left">
              <Box fontSize="xl" as="span">
                ⚙️&nbsp;
              </Box>
              Settings
            </Heading>
            <SyncInput />
          </TabPanel>
        </TabPanels>
        <TabList
          position="fixed"
          maxHeight="30vh"
          top="70%"
          borderLeftRadius="30%"
          p={3}
          // backdropFilter="blur(10px)"
          right={0}
          zIndex={2}
          bottom="0"
          bg="blackAlpha.800"
        >
          <Tab>
            <Heading size="lg">🪣</Heading>
          </Tab>
          <Tab>
            <Heading size="lg">🏄‍♂️</Heading>
          </Tab>
          <Tab>
            <Heading size="sm">⚙️</Heading>
          </Tab>
          <IconButton
            onClick={() => {
              window.location.reload();
            }}
            aria-label="sync"
            icon={<>🔄️</>}
            variant="ghost"
            filter={connected ? "grayscale(1)" : "initial"}
          />
        </TabList>
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

const useRtcConnectionShit = () => {
  const isVisible = usePageVisibility();
  const [connected, setIsConnected] = useState(
    webrtcProvider?.connected ?? false
  );

  useEffect(() => {
    webrtcProvider?.connect();
  }, [isVisible]);

  useEffect(() => {
    if (!webrtcProvider) return;
    const { connected } = webrtcProvider;
    setIsConnected(connected);

    if (!connected) {
      webrtcProvider.connect();
    }

    return () => {
      webrtcProvider.disconnect();
    };
  }, [webrtcProvider?.connected]);

  return connected;
};
