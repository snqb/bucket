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
    <Tabs
      defaultIndex={1}
      align="end"
      boxSizing="content-box"
      variant="unstyled"
      px={[1, 5, 10, 20, 300]}
      py={[1, 1, 1, 1, 1, 10]}
    >
      <TabList minH={50} _hover={{ cursor: "pointer" }}>
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
      fontSize="lg"
      color="gray.200"
      _focusVisible={false}
      _selected={{ fontSize: ["3xl", "5xl"], color: "white", fontStyle: "itallic" }}
      _hover={{ color: "pink.400" }}
      {...props}
    />
  );
};

export default App;
