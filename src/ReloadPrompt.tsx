import { Alert, Box, Button, Flex, Text } from "@chakra-ui/react";
import { useRegisterSW } from "virtual:pwa-register/react";

function ReloadPrompt() {
	// replaced dynamically
	const buildDate = "__DATE__";
	// replaced dyanmicaly
	const reloadSW = "__RELOAD_SW__";

	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, r) {
			console.log(`Service Worker at: ${swUrl}`);
			// @ts-expect-error just ignore
			if (reloadSW === "true") {
				r &&
					setInterval(() => {
						// rome-disable-next-line no-console
						console.log("Checking for sw update");
						r.update();
					}, 20000 /* 20s for testing purposes */);
			} else {
				// rome-disable-next-line prefer-template,no-console
				console.log(`SW Registered: ${r}`);
			}
		},
		onRegisterError(error) {
			// rome-disable-next-line no-console
			console.log("SW registration error", error);
		},
	});

	return needRefresh ? (
    <Flex
      bg={
        "linear-gradient(144deg, #c95fbb 25%, #2e2a12 25%, #2e2a12 50%, #c95fbb 50%, #c95fbb 75%, #2e2a12 75%, #2e2a12 100%)"
      }
      bgSize="68px"
      justify="center"
      position="fixed"
      bottom="0"
      left="0"
      width="100vw"
      direction="column"
      align="center"
      fontWeight="bold"
      color="white.50"
      zIndex={190}
      p={2}
    >
      <Flex
        bg="#000000AA"
        py={3}
        px={6}
        direction="column"
        align="center"
        gap={1}
      >
        <Text fontSize="2rem">🪣</Text>

        <Button
          color="white"
          variant="outline"
          onClick={() => updateServiceWorker(true)}
        >
          Update
        </Button>
      </Flex>
    </Flex>
  ) : null;
}

export default ReloadPrompt;
