import { Box, Button, Flex, HStack, Heading, VStack } from "@chakra-ui/react";

import { createContext } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { observable } from "@legendapp/state";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { AnimatePresence } from "framer-motion";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Map } from "./Map";
import Screen from "./Screen";
import { addScreen, persistor, store, useAppSelector } from "./store";

enableReactTracking({
  auto: true,
});
const mode$ = observable(2);
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

const AsGrid = () => {
  const mode = mode$.get();
  console.log(mode);

  return (
    <Box transition="all 1s ease-in-out">
      {mode === 1 && <Widest />}
      {mode > 1 && mode < 3 && <TwoDeeThing />}
      {mode >= 3 && <Heading>detailed</Heading>}
    </Box>
  );
};

const Widest = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const dispatch = useDispatch();

  console.log(structure);
  return (
    <VStack minH="20dvh" overflow="auto" align="start">
      {structure.map((row, rowIndex) => {
        return (
          <HStack key={rowIndex}>
            {row.map((name, columnIndex) => (
              <Flex direction="column" align="center" key={columnIndex}>
                <Flex align="center">
                  <Screen
                    h="60dvh"
                    w="60dvw"
                    key={name + columnIndex}
                    name={name}
                    onClick={() => {
                      mode$.set(2);
                      position$.set([rowIndex, columnIndex]);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      dispatch(
                        addScreen({
                          title: "new " + crypto.randomUUID().slice(0, 3),
                          x: columnIndex + 1,
                          y: rowIndex,
                        })
                      );
                    }}
                  >
                    +
                  </Button>
                </Flex>
                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(
                      addScreen({
                        title: "new " + crypto.randomUUID().slice(0, 3),
                        x: columnIndex,
                        y: rowIndex + 1,
                      })
                    );
                  }}
                >
                  +
                </Button>
              </Flex>
            ))}
          </HStack>
        );
      })}
    </VStack>
  );
};

const TwoDeeThing = () => {
  const structure = useAppSelector((state) => state.todo.structure);

  const [row, column] = position$.get();

  const name = structure[row][column];

  return (
    <Box>
      <Box position="fixed" bottom={0} right={0} m={2}>
        <Map onClick={() => mode$.set(1)} />
      </Box>
      <AnimatePresence>
        <Screen
          onDragEnd={(e, { offset: { x, y } }) => {
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
    </Box>
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
