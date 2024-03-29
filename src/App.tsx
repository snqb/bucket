import ReloadPrompt from "./ReloadPrompt";

import { observable } from "@legendapp/state";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { observer } from "@legendapp/state/react";
import { motion } from "framer-motion";
import { useContext, useRef, useState } from "react";
import { Provider } from "react-redux";
import { Pressable, Space, SpaceContext, ViewPort } from "react-zoomable-ui";
import { PersistGate } from "redux-persist/integration/react";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import { persistor, store, useAppSelector } from "./store";

enableReactTracking({
  auto: true,
});

/** 
  1: Wide screen
  2: Individual screen
  3: TBA -> Task level
*/
export const level$ = observable(import.meta.env.DEV ? 2 : 1);
/** position in a coordinate system, x is row, y is column */
export const position$ = observable([0, 0]);
export const $currentScreen = observable("");

function App() {
  const spaceRef = useRef<Space | null>(null);
  const [viewport, setViewport] = useState<ViewPort>();

  console.log(spaceRef.current);
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Space onUpdated={setViewport} ref={spaceRef} className="h-full w-full">
          <Widest />

          {/* <div
            className="bg-red absolute bottom-[2vh] right-0 p-3"
            onClick={() => {
              level$.set((x) => (x === 1 ? 2 : 1));
            }}
          >
            <Map />
          </div> */}
          <ReloadPrompt />
        </Space>
      </PersistGate>
    </Provider>
  );
}

const Widestt = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const { viewPort } = useContext(SpaceContext);

  return (
    <motion.div
      className={`align-start overflow-none h-min w-max snap-both snap-mandatory`}
      initial={{
        opacity: 0.8,
        scale: 2,
        x: 100,
        y: 100,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      }}
      exit={{ scale: 0 }}
      transition={{
        duration: 0.3,
        type: "spring",
        damping: 20,
        stiffness: 200,
      }}
      // style={{
      //   background: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnN2Z2pzPSJodHRwOi8vc3ZnanMuZGV2L3N2Z2pzIiB2aWV3Qm94PSIwIDAgNzAwIDcwMCIgd2lkdGg9IjcwMCIgaGVpZ2h0PSI3MDAiIG9wYWNpdHk9IjEiPjxkZWZzPjxmaWx0ZXIgaWQ9Im5ubm9pc2UtZmlsdGVyIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIiBmaWx0ZXJVbml0cz0ib2JqZWN0Qm91bmRpbmdCb3giIHByaW1pdGl2ZVVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJsaW5lYXJSR0IiPgoJPGZlVHVyYnVsZW5jZSB0eXBlPSJ0dXJidWxlbmNlIiBiYXNlRnJlcXVlbmN5PSIwLjA3MSIgbnVtT2N0YXZlcz0iNCIgc2VlZD0iMTUiIHN0aXRjaFRpbGVzPSJzdGl0Y2giIHg9IjAlIiB5PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcmVzdWx0PSJ0dXJidWxlbmNlIj48L2ZlVHVyYnVsZW5jZT4KCTxmZVNwZWN1bGFyTGlnaHRpbmcgc3VyZmFjZVNjYWxlPSIxMCIgc3BlY3VsYXJDb25zdGFudD0iMS44IiBzcGVjdWxhckV4cG9uZW50PSIyMCIgbGlnaHRpbmctY29sb3I9IiM2ODQ1ZGUiIHg9IjAlIiB5PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgaW49InR1cmJ1bGVuY2UiIHJlc3VsdD0ic3BlY3VsYXJMaWdodGluZyI+CiAgICAJCTxmZURpc3RhbnRMaWdodCBhemltdXRoPSIzIiBlbGV2YXRpb249IjExMCI+PC9mZURpc3RhbnRMaWdodD4KICAJPC9mZVNwZWN1bGFyTGlnaHRpbmc+CiAgCjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgZmlsbD0idHJhbnNwYXJlbnQiPjwvcmVjdD48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjcwMCIgZmlsbD0iIzY4NDVkZSIgZmlsdGVyPSJ1cmwoI25ubm9pc2UtZmlsdGVyKSI+PC9yZWN0Pjwvc3ZnPg==")`,
      // }}
    >
      {structure.map((row, y) => {
        return (
          <div
            className="flex snap-start snap-always items-stretch gap-2"
            key={y}
          >
            {row.map((name, x) => {
              const id = `${name}-${x}-${y}`;
              return (
                <Pressable
                  key={id}
                  className="flex flex-col items-stretch gap-2"
                  onTap={() => {
                    const element = document.querySelector(
                      `#${id}`,
                    ) as HTMLElement;
                    if (viewPort) {
                      console.log(element);
                      viewPort?.camera.centerFitElementIntoView(
                        element,
                        undefined,
                        {
                          durationMilliseconds: 400,
                        },
                      );
                    }
                  }}
                >
                  <Screen id={id} x={x} y={y} name={name} drag={false} />
                </Pressable>
              );
            })}
            <></>
          </div>
        );
      })}
    </motion.div>
  );
};

const Widest = observer(Widestt);
export default App;
