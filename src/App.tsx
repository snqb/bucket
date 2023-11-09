import { Box, Flex } from "@chakra-ui/react";

import {
  RefAttributes,
  createContext,
  forwardRef,
  useEffect,
  useState,
} from "react";
import ReloadPrompt from "./ReloadPrompt";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Controller, EffectCube, Virtual } from "swiper/modules";
import {
  Swiper,
  SwiperClass,
  SwiperSlide as Slide,
  SwiperProps,
  SwiperRef,
} from "swiper/react";
import Screen from "./Screen";
import { horizontalIndex, persistor, store, useAppSelector } from "./store";

const SLIDES = [["first"], ["second", "third"]];

export const CoordinatesContext = createContext([0, 0]);

const TwoDeeThing = () => {
  // const [slides, setSlides] = useState(SLIDES.concat([["fake vertical"]]));
  const slides = useAppSelector((state) => state.todo.structure);

  const [row, setRow] = useState(0);
  const [column, setColumn] = useState(0);

  return (
    <CoordinatesContext.Provider value={[row, column]}>
      <Swiper
        onSlideChange={(swiper) => {
          setRow(swiper.realIndex);
        }}
        direction="vertical"
        {...swiperProps}
      >
        {slides.map((row, columnIndex) => (
          <Slide key={columnIndex} virtualIndex={columnIndex}>
            <Swiper
              direction="horizontal"
              {...swiperProps}
              onSlideChange={(swiper) => {
                setColumn(swiper.realIndex);
              }}
            >
              {slides[columnIndex].map((name, index) => (
                <Slide key={name + index} virtualIndex={index}>
                  <Screen name={name} />
                </Slide>
              ))}
              <Slide virtualIndex={0}>
                <Screen fake name={"new " + crypto.randomUUID().slice(0, 3)} />
              </Slide>
            </Swiper>
          </Slide>
        ))}
        <Slide virtualIndex={0}>
          <Screen fake name={"new  " + crypto.randomUUID().slice(0, 3)} />
        </Slide>
      </Swiper>
    </CoordinatesContext.Provider>
  );
};

const swiperProps: SwiperProps = {
  slidesPerView: 1,
  loop: true,
  style: {
    height: "100vh",
    width: "100%",
  },
  virtual: true,
  modules: [Virtual],
};

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

export default App;
