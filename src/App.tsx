import { Flex } from "@chakra-ui/react";

import { createContext, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Virtual } from "swiper/modules";
import { SwiperSlide as Slide, Swiper, SwiperProps } from "swiper/react";
import Screen from "./Screen";
import { persistor, store, useAppSelector } from "./store";
import { clamp } from "ramda";

export const CoordinatesContext = createContext<[number, number]>([0, 0]);

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Flex overflowY="hidden">
          <TwoDeeThing />

          <ReloadPrompt />
        </Flex>
      </PersistGate>
    </Provider>
  );
}

const TwoDeeThing = () => {
  const structure = useAppSelector((state) => state.todo.structure);

  const [activeRow, setRow] = useState(0);
  const [activeColumn, setColumn] = useState(0);

  const isCorrectIndex = (index: number | undefined) =>
    index !== undefined && Number.isSafeInteger(index);

  return (
    <CoordinatesContext.Provider value={[activeRow, activeColumn]}>
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
                  structure[activeRow]?.length - 1,
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
