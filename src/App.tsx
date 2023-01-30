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

function App() {
  const [tab, setTab] = useState(
    Number(localStorage.getItem("current-tab")) ?? 0
  );

  useEffect(
    function persistCurrentTab() {
      localStorage.setItem("current-tab", tab.toString());
    },
    [tab]
  );

  return (
    <Flex px={[2, 5, 10, 20, 300]} py={[4, 1, 1, 1, 1, 10]} direction="column">
      <Tabs px={0} variant="soft-rounded" index={tab} onChange={setTab}>
        <TabList>
          <Tab>
            <Heading size="lg">🪣Bucket</Heading>
          </Tab>
          <Tab>
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
