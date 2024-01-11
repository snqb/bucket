import { Box, Flex, Grid, GridItem } from "@chakra-ui/react";

import { createContext, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Virtual } from "swiper/modules";
import { SwiperSlide as Slide, Swiper, SwiperProps } from "swiper/react";
import Screen from "./Screen";
import { persistor, store, useAppSelector } from "./store";
import { Map } from "./Map";
import { useGesture } from "@use-gesture/react";

export const CoordinatesContext = createContext<[number, number]>([0, 0]);

function App() {
  const [mode, setMode] = useState(1);


  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Flex overflowY="hidden">
          {mode === 0 && <TwoDeeThing />}
          {mode === 1 && <AsGrid />}
          <ReloadPrompt />
        </Flex>
      </PersistGate>
    </Provider>
  );
}

const AsGrid = () => {
  const { structure, values } = useAppSelector((state) => state.todo);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(1);

  console.log(structure)
  const bind = useGesture(
    {
      onDragEnd: (state) => {
        console.log(state.movement)
        const [dx, dy] = state.swipe;
        if (dx === 0 && dy === 0) return;
        if (!state.intentional) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          const where = dx < 0 ? 1 : -1;
          const next = getColumn(position[1] + where, structure[getRow(position[0], structure.length)].length);
          setPosition([position[0] + where, position[1]])
        } else {
          const where = dy < 0 ? 1 : -1;
          setPosition([position[0], position[1] + where])
        }
      },
      onPinchEnd: (state) => {
        console.log(state.offset, state.movement)
        setZoom(state.movement)
      },
    },
    {
      target: window,
      eventOptions: { passive: false },
      pinch: {
        scaleBounds: { min: 1, max: 10 },
      }
    }
  )

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

  const name = structure[getColumn(position[1], structure[getRow(position[0], structure.length)].length)][getRow(position[0], structure.length)];

  return (
    <Box transition="all 1s ease-in-out">
      {position.join(":")},<br />{getRow(position[0], structure.length)},{getColumn(position[1], structure[getRow(position[0], structure.length)].length)}<br />{zoom}
      <Screen
        fake
        key={'asdjklasd'}
        transform="scale(1)"
        width="100dvw"
        height="100dvh"
        name={name}
        {...bind}
      />
    </Box>
  );
};

const TwoDeeThing = () => {
  const structure = useAppSelector((state) => state.todo.structure);
  const [activeRow, setRow] = useState(0);
  const [activeColumn, setColumn] = useState(0);

  const isCorrectIndex = (index: number | undefined) =>
    index !== undefined && Number.isSafeInteger(index);

  return (
    <CoordinatesContext.Provider value={[activeRow, activeColumn]}>
      <Box
        mb={2}
        position="fixed"
        bottom={10}
        right={0}
        id="huemoe"
        zIndex="sticky"
      >
        <Map onClick={alert} />
      </Box>
      <Swiper
        {...swiperProps}
        onRealIndexChange={(swiper) => {
          if (isCorrectIndex(swiper.realIndex)) {
            setRow(swiper.realIndex);
          }
        }}
        direction="vertical"
      >
        {structure.map((row, rowIndex) => {
          return (
            <Slide key={"slide" + rowIndex} virtualIndex={rowIndex}>
              <Swiper
                {...swiperProps}
                key={rowIndex}
                direction="horizontal"
                onRealIndexChange={(swiper) => {
                  if (isCorrectIndex(swiper.realIndex)) {
                    setColumn(swiper.realIndex);
                  }
                }}
                initialSlide={Math.min(
                  activeColumn,
                  structure[activeRow]?.length - 1
                )}
              >
                {structure[rowIndex].map((name, columnIndex) => (
                  <Slide key={name + columnIndex} virtualIndex={columnIndex}>
                    <Screen name={name} />
                  </Slide>
                ))}
                {row.length > activeColumn - 1 && (
                  <Slide virtualIndex={row.length}>
                    <Screen
                      fake
                      name={"new " + crypto.randomUUID().slice(0, 3)}
                    />
                  </Slide>
                )}
              </Swiper>
            </Slide>
          );
        })}
        <Slide virtualIndex={structure.length}>
          <Screen fake name={"new  " + crypto.randomUUID().slice(0, 3)} />
        </Slide>
      </Swiper>
    </CoordinatesContext.Provider>
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
