import { Box, Button, Flex, HStack, Heading, VStack } from "@chakra-ui/react";
import { createContext, useRef } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { observable, observe } from "@legendapp/state";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { usePinch } from "@use-gesture/react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Map } from "./Map";
import Screen from "./Screen";
import { addScreen, persistor, store, useAppSelector } from "./store";

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
    mode$.set((prevMode) => Math.min(prevMode + 1, 2));
  } else if (direction < 0) {
    mode$.set((prevMode) => Math.max(prevMode - 1, 1));
  }
};

const AsGrid = () => {
  const mode = mode$.get();
  const ref = useRef() as any;
  const { structure } = useAppSelector((state) => state.todo);
  usePinch(
    (e) => {
      const name = (e.target as any).dataset.name;
      const coords = structure.reduce((acc, row, rowIndex, all) => {
        const columnIndex = row.indexOf(name);
        if (columnIndex > -1) {
          return [rowIndex, columnIndex];
        }
        return acc;
      }, position$.get());

      if (coords) {
        position$.set(coords);
      }
      handlePinch(e);
    },
    {
      target: window,
      preventDefault: true,
      enabled: false,
    }
  );

  return (
    <Box ref={ref}>
      <AnimatePresence>
        {mode <= 1 && <Widest />}
        {mode > 1 && mode <= 2 && <TwoDeeThing />}
      </AnimatePresence>
    </Box>
  );
};

const MBox = motion(Box);
const MVStack = motion(VStack);

const Widest = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const values = useAppSelector((state) => state.todo.values);
  const dispatch = useDispatch();

  const _scrollRef = useRef<number>();

  observe((e) => {
    const [row, column] = position$.get();
    const name = structure[row][column];

    _scrollRef.current = requestAnimationFrame(() => {
      document.querySelector(`[data-name="${name}"]`)?.scrollIntoView({
        block: "center",
        inline: "center",
      });
    });

    e.onCleanup = () => {
      _scrollRef?.current && cancelAnimationFrame(_scrollRef?.current);
    };
  });

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
      minH="20dvh"
      overflow="auto"
      align="start"
      p={6}
    >
      {structure.map((row, y) => {
        return (
          <HStack key={y} align="stretch">
            {row.map((name, x) => {
              // const isActive =
              //   rowIndex === position$.get()[0] &&
              //   columnIndex === position$.get()[1];

              return (
                <VStack align="center" key={x}>
                  <HStack align="center" h="100%">
                    <Screen
                      maxH="66vh"
                      minH="24vh"
                      w="66vw"
                      pb={4}
                      px={2}
                      key={name + x}
                      name={name}
                      drag={false}
                      onClick={() => {
                        mode$.set(2);
                        position$.set([y, x]);
                      }}
                    />
                    <Button
                      size="xs"
                      aspectRatio="1/1"
                      bg="gray.800"
                      onClick={createScreen("horizontal", { x, y })}
                    >
                      ➕
                    </Button>
                  </HStack>
                  <Button
                    bg="gray.800"
                    size="xs"
                    aspectRatio="1/1"
                    onClick={createScreen("vertical", { x, y })}
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
        duration: 0.3,
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
          // min is a hack here to achieve fallback without duplicating props, it sucks
          // and I'm not even sure it works
          w="min(100dvw, 100vw)"
          h="min(100dvh, 100vh)"
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
