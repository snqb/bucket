import { Container, Flex, Heading } from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";

function App() {
  return (
    <Container py={4}>
      <Flex justify="space-between">
        <Heading userSelect="none" as="h1" ml={1} mb={7}>
          🪣 Bucket
        </Heading>
      </Flex>

      <Bucket />
    </Container>
  );
}

export default App;
