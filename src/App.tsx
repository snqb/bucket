import ReloadPrompt from "./ReloadPrompt";

import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { observer } from "@legendapp/state/react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Provider } from "react-redux";
import { Space } from "react-zoomable-ui";
import { PersistGate } from "redux-persist/integration/react";
import Screen from "./Screen";
import { persistor, store, useAppSelector } from "./store";
import { Button } from "./components/ui/button";

enableReactTracking({
  auto: true,
});

function App() {
  const spaceRef = useRef<Space | null>(null);

  console.log(spaceRef.current);
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Space ref={spaceRef} className="h-full w-full">
          <Widest />
          <ReloadPrompt />
        </Space>
      </PersistGate>
    </Provider>
  );
}

const Widestt = () => {
  const structure = useAppSelector((state) => state.todo.structure);

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
    >
      {structure.map((row, y) => {
        return (
          <div
            className="flex snap-start snap-always items-stretch gap-2"
            key={y}
          >
            {row.map((name, x) => {
              const id = `screen-${name}`;
              return (
                <div
                  key={id}
                  className="max-w-screen flex flex-col items-stretch gap-2"
                >
                  <Screen id={id} x={x} y={y} name={name} drag={false} />
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
  );
};

const Widest = observer(Widestt);
export default App;

const Bg = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlBase="http://www.w3.org/2000/svg"
      viewBox="0 0 700 700"
      width="700"
      height="700"
    >
      <defs>
        <linearGradient
          gradientTransform="rotate(-57, 0.5, 0.5)"
          x1="50%"
          y1="0%"
          x2="50%"
          y2="100%"
          id="gggrain-gradient2"
        >
          <stop
            stop-color="hsla(221, 83%, 49%, 1.00)"
            stop-opacity="1"
            offset="-0%"
          ></stop>
          <stop
            stop-color="rgba(255,255,255,0)"
            stop-opacity="0"
            offset="100%"
          ></stop>
        </linearGradient>
        <linearGradient
          gradientTransform="rotate(57, 0.5, 0.5)"
          x1="50%"
          y1="0%"
          x2="50%"
          y2="100%"
          id="gggrain-gradient3"
        >
          <stop stop-color="hsl(316, 100%, 50%)" stop-opacity="1"></stop>
          <stop
            stop-color="rgba(255,255,255,0)"
            stop-opacity="0"
            offset="100%"
          ></stop>
        </linearGradient>
        <filter
          id="gggrain-filter"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.55"
            numOctaves="2"
            seed="2"
            stitchTiles="stitch"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="turbulence"
          ></feTurbulence>
          <feColorMatrix
            type="saturate"
            values="0"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="turbulence"
            result="colormatrix"
          ></feColorMatrix>
          <feComponentTransfer
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="colormatrix"
            result="componentTransfer"
          >
            <feFuncR type="linear" slope="3"></feFuncR>
            <feFuncG type="linear" slope="3"></feFuncG>
            <feFuncB type="linear" slope="3"></feFuncB>
          </feComponentTransfer>
          <feColorMatrix
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="componentTransfer"
            result="colormatrix2"
            type="matrix"
            values="1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 21 -13"
          ></feColorMatrix>
        </filter>
      </defs>
      <g>
        <rect width="100%" height="100%" fill="hsl(0, 100%, 60%)"></rect>
        <rect width="100%" height="100%" fill="url(#gggrain-gradient3)"></rect>
        <rect width="100%" height="100%" fill="url(#gggrain-gradient2)"></rect>
        <rect
          width="100%"
          height="100%"
          fill="transparent"
          filter="url(#gggrain-filter)"
          opacity="1"
          style="mix-blend-mode: soft-light"
        ></rect>
      </g>
    </svg>
  );
};
