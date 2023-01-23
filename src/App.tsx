import { Flex, Heading, IconButton } from "@chakra-ui/react";
import Bucket from "./Bucket";

import "@fontsource/lato";
import ReloadPrompt from "./ReloadPrompt";

function App() {
  return (
    <Flex px={[4, 5, 10, 20, 300]} py={[4, 1, 1, 1, 1, 10]} direction="column">
      <Flex justify="space-between">
        <Heading>🪣Bucket</Heading>
        <IconButton
          onClick={() => {
            // @ts-ignore
            window.location.reload();
          }}
          aria-label="sync"
          icon={<>🔄️</>}
        />
      </Flex>
      <Bucket />
      <ReloadPrompt />
    </Flex>
  );
}

export default App;
