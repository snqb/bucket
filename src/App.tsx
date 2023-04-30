import {
  Flex,
  Heading, Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import { useEffect, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";
import Today from "./Today";

import { Clean } from "./@components/Clean";
import Later from "./Later";

// localStorage.setItem("log", "y-webrtc");

function App() {
  const [tab, setTab] = usePersistedTab();

  return (
    <Flex
      px={[2, 5, 10, 20, 300]}
      py={[4, 1, 1, 1, 1, 10]}
      direction="column"
      scrollBehavior="smooth"
    >
      <Tabs px={0} variant="soft-rounded" index={tab} onChange={setTab}>
        <TabList bg="blackAlpha.800">
          <Tab>
            <Heading size="lg">🪣Bucket</Heading>
          </Tab>
          <Tab>
            <Heading size="lg">🏄‍♂️Today</Heading>
          </Tab>
          {/* <Tab>
            <Heading size="lg">❓</Heading>
          </Tab> */}
        </TabList>
        <TabPanels>
          <TabPanel>
            <Clean what="bucket" />

            <Bucket />
          </TabPanel>

          <TabPanel>
            <Clean what="today" />

            <Today />
          </TabPanel>

          {/* <TabPanel>
            <Later />
          </TabPanel> */}
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
