import { Box, Button, Flex, HStack, Heading, VStack } from "@chakra-ui/react";
import { createContext, useRef } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { observable, observe } from "@legendapp/state";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { AnimatePresence, Target, Target, motion } from "framer-motion";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Map } from "./Map";
import Screen from "./Screen";
import { addScreen, persistor, store, useAppSelector } from "./store";
import { useGesture } from "@use-gesture/react";
import { o } from "ramda";

enableReactTracking({
  auto: true,
});

export const mode$ = observable(2);
export const position$ = observable([0, 0]);

export const CoordinatesContext = createContext<[number, number]>([0, 0]);

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Flex>
          <AsGrid />
          <ReloadPrompt />
        </Flex>
      </PersistGate>
    </Provider>
  );
}

const handlePinch = (props: any) => {
  const direction = props.direction[0];
  if (direction > 0) {
    mode$.set((prevMode) => Math.min(prevMode + 1, 3));
  } else if (direction < 0) {
    mode$.set((prevMode) => Math.max(prevMode - 1, 1));
  }
};

const AsGrid = () => {
  const mode = mode$.get();
  const ref = useRef() as any;
  useGesture(
    {
      onPinchEnd: handlePinch,
    },
    {
      target: window,
      pinchOnWheel: false,
      preventDefault: true,
    }
  );

  return (
    <Box transition="all 1s ease-in-out" ref={ref}>
      {mode === 1 && <Widest />}
      {mode > 1 && mode < 3 && <TwoDeeThing />}
      {mode >= 3 && <Heading>detailed</Heading>}
    </Box>
  );
};

const MBox = motion(Box);
const MVStack = motion(VStack);

const Widest = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const values = useAppSelector((state) => state.todo.values);
  const dispatch = useDispatch();

  observe((e) => {
    const [row, column] = position$.get();
    const name = structure[row][column];

    const scrollRaf = requestAnimationFrame(() => {
      document.querySelector(`[data-name="${name}"]`)?.scrollIntoView();
    });

    e.onCleanup = () => {
      cancelAnimationFrame(scrollRaf);
    };
  });

  return (
    <MVStack
      initial={{ opacity: 0.8, scale: 2, x: 100, y: 100 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ scale: 0 }}
      transition={{
        duration: 0.5,
        type: "spring",
        damping: 20,
        stiffness: 200,
      }}
      minH="20dvh"
      overflow="auto"
      align="start"
      p={6}
    >
      {structure.map((row, rowIndex) => {
        return (
          <HStack key={rowIndex} align="stretch">
            {row.map((name, columnIndex) => {
              const createScreen = (axis: "horizontal" | "vertical") => () => {
                const title = prompt("What is the name of the screen?");
                if (title && !values[title]) {
                  dispatch(
                    addScreen({
                      title: title,
                      x: columnIndex + (axis === "horizontal" ? 1 : 0),
                      y: rowIndex + (axis === "vertical" ? 1 : 0),
                    })
                  );
                }
              };

              const isActive =
                rowIndex === position$.get()[0] &&
                columnIndex === position$.get()[1];

              if (isActive) {
              }

              return (
                <VStack align="center" key={columnIndex}>
                  <HStack align="center" h="100%">
                    <Screen
                      data-name={name}
                      maxH="66dvh"
                      minH="24dvh"
                      w="66dvw"
                      pb={4}
                      px={2}
                      key={name + columnIndex}
                      name={name}
                      drag={false}
                      onClick={() => {
                        mode$.set(2);
                        position$.set([rowIndex, columnIndex]);
                      }}
                    />
                    <Button
                      size="xs"
                      aspectRatio="1/1"
                      bg="gray.800"
                      onClick={createScreen("horizontal")}
                    >
                      ➕
                    </Button>
                  </HStack>
                  <Button
                    bg="gray.800"
                    size="xs"
                    aspectRatio="1/1"
                    onClick={createScreen("vertical")}
                  >
                    ➕
                  </Button>
                </VStack>
              );
            })}
          </HStack>
        );
      })}
    </MVStack>
  );
};

const TwoDeeThing = () => {
  const [row, column] = position$.get();
  const structure = useAppSelector((state) => state.todo.structure);

  const name = structure[row][column];

  return (
    <MBox
      initial={{
        opacity: 0.7,
        scale: 0.6,
      }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.2 }}
      transition={{
        duration: 0.5,
        type: "spring",
        damping: 20,
        stiffness: 200,
      }}
    >
      <Box
        onClick={() => {
          mode$.set(1);
        }}
        position="fixed"
        bottom={0}
        right={0}
        p={3}
      >
        <Map />
      </Box>
      <AnimatePresence>
        <Screen
          onDragEnd={(e, { delta: { x, y }, ...props }) => {
            if (x === 0 && y === 0) return;
            if (Math.abs(x) > Math.abs(y)) {
              const where = x < 0 ? 1 : -1;
              const next = looped(column + where, structure[row].length);
              position$.set([row, next]);
            } else {
              const where = y < 0 ? 1 : -1;
              const next = looped(row + where, structure.length);
              position$.set([next, column]);
            }
          }}
          w="100dvw"
          h="100dvh"
          name={name}
        />
      </AnimatePresence>
    </MBox>
  );
};

export default App;

const looped = (row: number, max: number) => {
  let x;
  if (row < 0) {
    const z = Math.abs(row) % max;
    x = (max - z) % max;
  } else if (row >= max) {
    x = row % max;
  } else {
    x = row;
  }

  return x;
};
