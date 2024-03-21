import { Box, Button, Flex, HStack, VStack } from "@chakra-ui/react";
import ReloadPrompt from "./ReloadPrompt";

import { observable, observe } from "@legendapp/state";
import { observer } from "@legendapp/state/react";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { motion } from "framer-motion";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Map } from "./Map";
import Screen from "./Screen";
import { addScreen, persistor, store, useAppSelector } from "./store";

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
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Flex>
          <Widest />
          <ReloadPrompt />
        </Flex>
      </PersistGate>
    </Provider>
  );
}

const MVStack = motion(VStack);

const Widestt = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const values = useAppSelector((state) => state.todo.values);
  const dispatch = useDispatch();

  const createScreen =
    (axis: "horizontal" | "vertical", { x, y }: { y: number; x: number }) =>
    () => {
      const title = prompt("What is the name of the screen?");
      if (title && !values[title]) {
        dispatch(
          addScreen({
            title: title,
            x: x + (axis === "horizontal" ? 1 : 0),
            y: y + (axis === "vertical" ? 1 : 0),
          })
        );
      }
    };

  observe(() => {
    const screen = $currentScreen.get();
    const element = document.querySelector(`[data-name="${screen}"]`);
    if (element) {
      element.scrollIntoView({});
    }
  });

  return (
    <MVStack
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
      w="100vw"
      h="100vh"
      overflow="auto"
      align="start"
      
      scrollSnapType={level$.get() === 1 ? "initial" : "both mandatory"}
      transform={level$.get() === 1 ? "scale(0.5)" : "scale(1)"}
      // backgroundColor="black"
      backgroundImage="url(https://ahoylemon.github.io/BG2COOL//patterns/random/gramma-shower-curtain.png)"
      backgroundSize="12%"
      backgroundPosition="23% 45%"
    >
      {level$.get() === 2 && (
        <Box
          onClick={() => {
            level$.set((x) => (x === 1 ? 2 : 1));
          }}
          position="fixed"
          bottom="2vh"
          right="0"
          p={3}
        >
          <Map />
        </Box>
      )}
      {structure.map((row, y, { length: yLength }) => {
        return (
          <HStack key={y} align="stretch">
            {row.map((name, x) => {
              return (
                <VStack align="center" key={x}>
                  <HStack
                    align="start"
                    h="100%"
                    scrollSnapAlign="start"
                    scrollSnapStop="always"
                    scrollPaddingRight="20px"
                    id="screens"
                  >
                    <Screen
                      h={level$.get() === 2 ? "100vh" : "100%"}
                      w={level$.get() === 2 ? "100vw" : "100%"}

                      minW="28ch"
                      x={x}
                      y={y}
                      pb={4}
                      px={2}
                      key={name + x}
                      name={name}
                      drag={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        level$.set(2);
                        $currentScreen.set(name);
                        setTimeout(() => {
                          (e.target as Element)?.scrollIntoView();
                        }, 0);
                      }}
                      border={level$.get() === 1 ? "1px solid gray" : undefined}
                    />
                    <Button
                      size="xs"
                      aspectRatio="1/1"
                      bg="gray.800"
                      onClick={createScreen("horizontal", { x, y })}
                      alignSelf="center"
                    >
                      ➕
                    </Button>
                  </HStack>
                  {y === yLength - 1 && x === 0 && (
                    <Button
                      bg="gray.800"
                      size="xs"
                      aspectRatio="1/1"
                      onClick={createScreen("vertical", { x, y })}
                    >
                      ➕
                    </Button>
                  )}
                </VStack>
              );
            })}
          </HStack>
        );
      })}
    </MVStack>
  );
};

const Widest = observer(Widestt);
export default App;
