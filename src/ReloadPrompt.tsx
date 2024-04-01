import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "./components/ui/button";

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
    <div className="fixed bottom-0 left-0 flex w-full flex-col justify-center bg-gradient-to-tr from-black to-violet-800">
      <div className="flex flex-col items-center gap-1 bg-transparent px-6 py-3">
        <p className="text-lg">🪣</p>

        <Button
          color="white"
          className="bg-black"
          variant="outline"
          onClick={() => updateServiceWorker(true)}
        >
          Update Bucket
        </Button>
        <Button
          color="white"
          className="bg-black"
          variant="outline"
          onClick={() => setNeedRefresh(false)}
        >
          Nope
        </Button>
      </div>
    </div>
  ) : null;
}

export default ReloadPrompt;
