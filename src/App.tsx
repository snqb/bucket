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
  const isVisible = usePageVisibility();
  const [connected, setIsConnected] = useState(
    webrtcProvider?.connected ?? false
  );

  const [tab, setTab] = useState(
    Number(localStorage.getItem("current-tab")) ?? 0
  );

  useEffect(
    function persistCurrentTab() {
      localStorage.setItem("current-tab", tab.toString());
    },
    [tab]
  );

  useEffect(() => {
    webrtcProvider?.connect();
  }, [isVisible]);

  useEffect(() => {
    setIsConnected(webrtcProvider?.connected);
  }, [webrtcProvider?.connected]);

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
