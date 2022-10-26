import {
  Box,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import Adder from "./Adder";

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

      <Box width="90%" position="fixed" bottom="5vh">
        <Adder />
      </Box>
    </Container>
  );
}

const MyTab = (props: any) => {
  return (
    <Tab
      as={Heading}
      fontSize="small"
      _selected={{ fontSize: "2xl" }}
      {...props}
    />
  );
};

export default App;
