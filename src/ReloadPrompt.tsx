import "./ReloadPrompt.css";

import { useRegisterSW } from "virtual:pwa-register/react";
import { Alert, AlertIcon, Box } from "@chakra-ui/react";

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
            // eslint-disable-next-line no-console
            console.log("Checking for sw update");
            r.update();
          }, 20000 /* 20s for testing purposes */);
      } else {
        // eslint-disable-next-line prefer-template,no-console
        console.log("SW Registered: " + r);
      }
    },
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return offlineReady || needRefresh ? (
    <Box position="fixed" bottom="0">
      <Alert status="info">
        <AlertIcon />
        <div className="ReloadPrompt-message">
          {offlineReady ? (
            <span>App ready to work offline</span>
          ) : (
            <span>
              New content available, click on reload button to update.
            </span>
          )}
        </div>
        {needRefresh && (
          <button
            className="ReloadPrompt-toast-button"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        )}
        <button className="ReloadPrompt-toast-button" onClick={() => close()}>
          Close
        </button>
      </Alert>
    </Box>
  ) : null;
}

export default ReloadPrompt;
