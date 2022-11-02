import {
  Container,
  Heading,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import Shuffle from "./Shuffle";
import Adder from "./Adder";

function App() {
  return (
    <Flex
      // position="relative"
      px={[1, 5, 10, 20, 300]}
      py={[1, 1, 1, 1, 1, 10]}
      direction="column"
    >
      <Tabs
        defaultIndex={1}
        align="end"
        boxSizing="content-box"
        variant="unstyled"
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
      <Flex
        position="sticky"
        width="100%"
        p={1}
        bottom="0"
        height="10vh"
        justifySelf="flex-end"
        background="black"
      >
        <Adder />
      </Flex>
    </Flex>
  );
}

const MyTab = (props: any) => {
  return (
    <Tab
      as={Heading}
      fontSize="lg"
      color="gray.200"
      _focusVisible={false}
      _selected={{
        fontSize: ["3xl", "5xl"],
      }}
      _hover={{ color: "pink.400" }}
      {...props}
    />
  );
};

export default App;
