import { Box, Button, Flex, HStack, Heading, VStack } from "@chakra-ui/react";

import { createContext, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { observable } from "@legendapp/state";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { useGesture, useDrag } from "@use-gesture/react";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Virtual } from "swiper/modules";
import { SwiperProps } from "swiper/react";
import { lock } from 'tua-body-scroll-lock';
import { Map } from "./Map";
import Screen from "./Screen";
import { addScreen, persistor, store, useAppSelector } from "./store";

lock()

enableReactTracking({
  auto: true,
});
const mode$ = observable(1);

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
  console.log(mode)

  const bind = useGesture(
    {
      onPinchEnd: (state) => {
        console.log(state)
        mode$.set(prev => prev + state.direction[0])
      }
    },
    {
      target: window,
      eventOptions: { passive: false },
    }
  )


  return (
    <Box transition="all 1s ease-in-out" {...bind}>
      {/* {position.join(":")},<br />{getRow(position[0], structure.length)},{getColumn(position[1], structure[getRow(position[0], structure.length)].length)}<br />{mode}\ */}

      {mode === 1 && <Widest />}
      {mode > 1 && mode < 3 && <TwoDeeThing />}
      {mode >= 3 && <Heading>detailed</Heading>}
    </Box>
  );
};


const Widest = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const dispatch = useDispatch();


  console.log(structure)
  return <VStack minH="20dvh" overflow="auto" align="start">
    {structure.map((row, rowIndex) => {
      return <HStack>
        {row.map((name, columnIndex) => (
          <Flex direction="column" align="center">
            <Flex align="center">
              <Screen h="60dvh" w="60dvw" key={name + columnIndex} name={name} />
              <Button variant="outline" onClick={() => {
                dispatch(addScreen({ title: "new " + crypto.randomUUID().slice(0, 3), x: columnIndex + 1, y: rowIndex }))
              }}>+</Button>
            </Flex>
            <Button variant="outline" onClick={() => {
              dispatch(addScreen({ title: "new " + crypto.randomUUID().slice(0, 3), x: columnIndex, y: rowIndex + 1 }))
            }}>+</Button>
          </Flex>
        ))}
      </HStack>
    })}

  </VStack >

}

const TwoDeeThing = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const [position, setPosition] = useState<[number, number]>([0, 0]);

  const x = getColumn(position[0], structure[getRow(position[0], structure.length)].length);
  const y = getRow(position[0], structure.length);

  const name = structure[y][x];

  const xx = useDrag((state) => {
    console.log(state)
    const [dx, dy] = state.swipe;
    if (dx === 0 && dy === 0) return;
    if (!state.intentional) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      const max = structure[position[1]].length
      const where = -dx;
      const next = getRow(position[0] + where, max);
      console.log("where?", where, position[0], max, "and next is", next)
      setPosition([next, position[1]])
    } else {
      const where = dy < 0 ? 1 : -1;
      const next = getRow(position[1] + where, structure.length)
      setPosition([position[0], next])
    }
  }, {
    // preventScroll: true
    target: window,
  })

  return (
    <Box {...xx}>
      <Box m={2}><Map x={position[1]} y={position[0]} /></Box>
      <Screen w="100dvw" name={name} />
    </Box>
  );
};

const swiperProps: SwiperProps = {
  modules: [Virtual],
  slidesPerView: 1,
  loop: true,
  style: {
    height: "100dvh",
    width: "100%",
  },
  observer: true, // cause I add slides
  virtual: true, // Slides are virtual, I add/remove all the time
  loopAddBlankSlides: true,
  loopAdditionalSlides: 1,
};

export default App;


const getRow = (row: number, max: number) => {
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
}

const getColumn = (column: number, max: number) => {
  let y;
  if (column < 0) {
    const z = Math.abs(column) % max;
    y = (max - z) % max;
  } else if (column >= max) {
    y = column % max;
  } else {
    y = column;
  }
  return y;
}
