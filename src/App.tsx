import { Box, Container, Heading, VStack, Text } from "@chakra-ui/react";
import Adder from "./Adder";
import Bucket from "./Bucket";
import Rejected from "./Rejected";
import Today from "./Today";

import "@fontsource/lato";

function App() {
  return (
    <Container>
      <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
        <Heading as="h1">Today</Heading>
        <Adder today />

        <Today />
      </VStack>

      <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
        <Heading
          as="h1"
          onClick={() => {
            document.getElementById("bucket")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          🪣Bucket
        </Heading>
        <Bucket />
        <Adder />
        <Rejected />
      </VStack>
    </Container>
  );
}

export default App;
