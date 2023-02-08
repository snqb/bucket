import {
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
  // overflowY: "auto", // tasks inside should be scrollable
};

localStorage.setItem("log", "y-webrtc");

function App() {
  const [tab, setTab] = usePersistedTab();
  const connected = useRtcConnectionShit();
  console.log(tab);

  return (
    <Flex px={[2, 5, 10, 20, 300]} py={[4, 1, 1, 1, 1, 10]} direction="column">
      <Tabs px={0} variant="soft-rounded" index={tab} onChange={setTab}>
        <TabPanels pt={10} height="80vh">
          <TabPanel {...panelStyles}>
            <Bucket />
          </TabPanel>
          <TabPanel {...panelStyles}>
            <Today />
          </TabPanel>
          <TabPanel>
            <SyncInput />
          </TabPanel>
        </TabPanels>
        <TabList
          position="fixed"
          bottom="0"
          h="27vh"
          w="full"
          bg="black"
          px={5}
          py={10}
        >
          <Flex w="full" direction="column" justify="space-around">
            {tab < 2 && <Adder where={tab === 0 ? "bucket" : "today"} />}

            <Flex>
              <Tab>
                <Heading size="md">🪣Bucket</Heading>
              </Tab>
              <Tab>
                <Heading size="md">☀️Today</Heading>
              </Tab>
              <Tab>
                <Heading size="md">⚙️</Heading>
              </Tab>
              <IconButton
                ml="auto"
                alignSelf="center"
                onClick={() => {
                  window.location.reload();
                }}
                aria-label="sync"
                icon={<>🔄️</>}
                variant="ghost"
                filter={connected ? "grayscale(1)" : "initial"}
              />
            </Flex>
          </Flex>
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
