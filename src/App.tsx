import ReloadPrompt from "./ReloadPrompt";

import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { observer } from "@legendapp/state/react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import Screen from "./Screen";
import { Button } from "./components/ui/button";
import {
  addScreen,
  persistor,
  store,
  useAppDispatch,
  useAppSelector,
} from "./store";
// import "react-resizable/css/styles.css";
import MagicGrid from "magic-grid";

enableReactTracking({
  auto: true,
});

import PocketBase from "pocketbase";

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

const x = await pb.collection("shits").getList(1, 10);
// .authWithPassword("admin@bucket.com", "sukapidr19");
console.log(x);

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Widest />
        <ReloadPrompt />
      </PersistGate>
    </Provider>
  );
}

const Widestt = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const dispatch = useAppDispatch();
  const values = useAppSelector((state) => state.todo.values);

  useEffect(() => {
    console.log(document.getElementById("grid"));

    let magicGrid = new MagicGrid({
      container: "#grid", // Required. Can be a class, id, or an HTMLElement.
      items: Object.keys(values).length, // For a grid with 20 items. Required for dynamic content.
      animate: true, // Optional.
      maxColumns: 5,
    });

    magicGrid.listen();
  }, [values]);

  const confirmAdd = () => {
    const name = prompt("What is the name of the new screen?");
    if (name) {
      dispatch(addScreen({ title: name }));
    }
  };

  return (
    <div className="flex flex-col">
      <Button onClick={confirmAdd}></Button>
      <div id="grid" className="min-w-[100vw]">
        {Object.keys(values).map((key, index) => {
          return (
            <Screen
              id={key}
              className="min-h-[40vh] p-4 max-md:w-full md:min-h-[40ch]"
              x={0}
              y={0}
              name={key}
              drag={false}
              onClick={(e) =>
                e.currentTarget.scrollIntoView({
                  block: "center",
                  inline: "center",
                  behavior: "smooth",
                })
              }
            />
          );
        })}
      </div>
    </div>
  );

  const observer = useRef(
    new IntersectionObserver(
      (entries) => {
        // if (entries.length === 1) {
        //   entries.at(0)?.target.scrollIntoView();
        // }
      },
      { threshold: 1 },
    ),
  );

  useEffect(() => {
    observer.current.observe(document.querySelector("[data-screen]")!);
    return () => {
      observer.current.disconnect();
    };
  }, [observer.current]);

  return (
    <div className="flex h-max min-h-screen flex-col">
      <Button
        onClick={() => {
          dispatch(
            addScreen({
              title: "New Screen",
            }),
          );
        }}
        className=""
      >
        +
      </Button>
      <motion.div
        className={`flex h-max w-max snap-both snap-mandatory flex-col gap-4 overflow-auto`}
      >
        {structure.map((row, y) => {
          return (
            <div
              className="flex snap-start snap-always items-stretch gap-4"
              key={y}
            >
              {row.map((name, x) => {
                const id = `screen-${name}`;
                return (
                  <div
                    key={id}
                    data-screen={name}
                    className="max-w-screen flex min-w-[40ch] flex-col md:max-w-[70ch]"
                  >
                    <Screen
                      id={id}
                      className="min-h-[40vh] p-4 md:min-h-[40ch]"
                      x={x}
                      y={y}
                      name={name}
                      drag={false}
                      onClick={(e) =>
                        e.currentTarget.scrollIntoView({
                          block: "center",
                          inline: "center",
                          behavior: "smooth",
                        })
                      }
                    />
                  </div>
                );
              })}
              <></>
            </div>
          );
        })}
        <Button
          variant="ghost"
          size="lg"
          className="fixed bottom-0 right-0 p-4 text-xs text-white"
        >
          🏠
        </Button>
      </motion.div>
    </div>
  );
};

const Widest = observer(Widestt);
export default App;
