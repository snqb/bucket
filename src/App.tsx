import { Box, Container, Heading, VStack } from "@chakra-ui/react";
import Adder from "./Adder";
import Bucket from "./Bucket";
import Rejected from "./Rejected";
import Today from "./Today";

function App() {
  return (
    <Container>
      <VStack spacing={3} align="stretch" sx={{ height: "100vh" }} py={3}>
        <Heading as="h1">Today</Heading>

        <Today />
      </VStack>

      <VStack spacing={3} align="stretch" sx={{ height: "100vh" }} py={3}>
        <Heading as="h1">Bucket</Heading>
        <Bucket />
        <Adder />
        <Rejected />
      </VStack>
    </Container>
  );
}

export default App;
