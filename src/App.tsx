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

function App() {
  return (
    <Flex px={[4, 5, 10, 20, 300]} py={[4, 1, 1, 1, 1, 10]} direction="column">
      <Tabs variant="unstyled">
        <TabList>
          <Tab _selected={{ bg: "rgba(220, 120, 50, 0.2)" }}>
            <Heading size="lg">🪣Bucket</Heading>
          </Tab>
          <Tab _selected={{ bg: "rgba(220, 120, 50, 0.2)" }}>
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
