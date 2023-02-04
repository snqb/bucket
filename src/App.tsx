import {
  Flex,
  Heading,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import ReloadPrompt from "./ReloadPrompt";
import Today from "./Today";
import { useState, useEffect } from "react";
import { usePageVisibility } from "react-page-visibility";
import { webrtcProvider } from "./store";

function App() {
  const [tab, setTab] = usePersistedTab();
  const connected = useRtcConnectionShit();

  return (
    <Flex px={[2, 5, 10, 20, 300]} py={[4, 1, 1, 1, 1, 10]} direction="column">
      <Tabs px={0} variant="unstyled" index={tab} onChange={setTab}>
        <TabList>
          <Tab _selected={{ color: "blue.500" }}>
            <Heading size="lg">🪣Bucket</Heading>
          </Tab>
          <Tab _selected={{ color: "blue.500" }}>
            <Heading size="lg">☀️Today</Heading>
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
        </TabList>
        <TabPanels>
          <TabPanel>
            <Bucket />
          </TabPanel>
          <TabPanel>
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
      console.log("huemoe");
      webrtcProvider.disconnect();
    };
  }, [webrtcProvider?.connected]);

  return isVisible;
};
