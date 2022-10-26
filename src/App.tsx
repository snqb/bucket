import {
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";

function App() {
  return (
    <Container position="relative" py={4}>
      <Tabs variant="unstyled">
        <TabList>
          <MyTab>🪣 Bucket</MyTab>
          <MyTab>⏳🥊 Today</MyTab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Bucket />
          </TabPanel>
          <TabPanel>
            <p>coming soon..</p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
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
