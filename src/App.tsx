import {
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import Shuffle from "./Shuffle";

function App() {
  return (
    <Tabs variant="unstyled">
      <TabList>
        <MyTab>🪣 Bucket</MyTab>
        <MyTab>🔀 Shuffle</MyTab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Bucket />
        </TabPanel>
        <TabPanel>
          <Shuffle />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

const MyTab = (props: any) => {
  return (
    <Tab
      as={Heading}
      fontSize="xx-small"
      color="gray.200"
      _focusVisible={false}
      _selected={{ fontSize: "3xl", color: "white" }}
      {...props}
    />
  );
};

export default App;
