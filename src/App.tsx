import { Container } from "@chakra-ui/react";
import Bucket from "./Bucket";
import Today from "./Today";

import "@fontsource/lato";

function App() {
  return (
    <Container>
      <Today />
      <Bucket />
    </Container>
  );
}

export default App;
