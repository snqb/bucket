import { Container } from "@chakra-ui/react";
import Bucket from "./Bucket";
import Today from "./Today";

import "@fontsource/lato";

function App() {
  return (
    <Container py={4}>
      <Today />
      <Bucket />
    </Container>
  );
}

export default App;
