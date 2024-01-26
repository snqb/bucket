import { Box, Button, Flex, HStack, Heading, VStack } from "@chakra-ui/react";
import { createContext, useRef } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { observable } from "@legendapp/state";
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
        <Flex overflowY="hidden">
          <AsGrid />
          <ReloadPrompt />
        </Flex>
      </PersistGate>
    </Provider>
  );
}

const lastX$ = observable([0, 0]);
const handlePinch = ({ _delta }) => {
  const direction = _delta[0];
  console.log(direction);
  if (direction > 0) {
    console.log("down");
    mode$.set((prevMode) => Math.min(prevMode + 1, 3));
  } else if (direction < 0) {
    console.log("up");
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
      preventScroll: true,
    }
  );

  return (
    <Box
      transition="all 1s ease-in-out"
      ref={ref}
      onClick={(e) => {
        //get position of the click
        console.log(e.clientX);
        lastX$.set([e.clientX, e.clientY]);
      }}
    >
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

  console.log(structure);
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
    >
      {structure.map((row, rowIndex) => {
        return (
          <HStack key={rowIndex}>
            {row.map((name, columnIndex) => (
              <VStack align="center" key={columnIndex}>
                <HStack align="center">
                  <Screen
                    h="66dvh"
                    w="66dvw"
                    key={name + columnIndex}
                    name={name}
                    drag={false}
                    onClick={() => {
                      mode$.set(2);
                      position$.set([rowIndex, columnIndex]);
                    }}
                  />
                  <Button
                    size="sm"
                    bg="gray.800"
                    onClick={() => {
                      const x = prompt("What is the name of the screen?");

                      if (x && !values[x]) {
                        dispatch(
                          addScreen({
                            title: x,
                            x: columnIndex + 1,
                            y: rowIndex,
                          })
                        );
                      }
                    }}
                  >
                    🪣
                  </Button>
                </HStack>
                <Button
                  bg="gray.800"
                  size="sm"
                  onClick={() => {
                    const x = prompt("What is the name of the screen?");

                    if (x && !values[x]) {
                      dispatch(
                        addScreen({
                          title: x,
                          x: columnIndex,
                          y: rowIndex + 1,
                        })
                      );
                    }
                  }}
                >
                  🪣
                </Button>
              </VStack>
            ))}
          </HStack>
        );
      })}
    </MVStack>
  );
};

const TwoDeeThing = () => {
  const structure = useAppSelector((state) => state.todo.structure);

  const [row, column] = position$.get();

  const name = structure[row][column];

  const [x, y] = lastX$.get();
  console.log(x, y);

  return (
    <MBox
      initial={{ opacity: 0.7, scale: 0.5, x: x / 2, y: y / 2 }}
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
              console.log(`now is ${column}:${row}, next row is ${next}`);
              position$.set([next, column]);
            }
          }}
          w="100dvw"
          minH="60vh"
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
