import {
  Flex,
  Heading,
  HStack,
  Spacer,
  StackDivider,
  VStack,
} from "@chakra-ui/react";

import { useEffect, useRef, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";
import Today from "./Today";

import Later from "./Later";
import Bucket from "./Bucket";
import { Clean } from "./@components/Clean";
import { Swiper, SwiperSlide } from "swiper/react";
import { useLocalStorageValue } from "./utils";

function App() {
  const [slide, setSlide] = useLocalStorageValue("current-slide", 0);

  return (
    <Flex px={[5, 5, 10, 20, 300]} pt={12} maxW="500px" overflowY="hidden">
      <Swiper
        style={{
          height: "100vh",
          width: "100%",
        }}
        cssMode
        direction="vertical"
        slidesPerView={2}
        spaceBetween={4}
        centeredSlides
        initialSlide={slide}
        onSlideChange={(it) => {
          setSlide(it.activeIndex);
        }}
      >
        <SwiperSlide>
          <VStack
            filter={0 !== slide ? "opacity(0.5)" : "initial"}
            align="stretch"
            h="50vh"
            spacing={8}
          >
            <Heading size="2xl">Short</Heading>
            <Later />
          </VStack>
        </SwiperSlide>

        <SwiperSlide>
          <VStack
            overflowY="auto"
            align="stretch"
            minH="50vh"
            h="max-content"
            filter={1 !== slide ? "opacity(0.5)" : "initial"}
            spacing={8}
          >
            <HStack justify="space-between">
              <Heading size="2xl">Long</Heading>
              <Clean what="today" />
            </HStack>

            <Today />
          </VStack>
        </SwiperSlide>

        <SwiperSlide>
          <VStack
            align="stretch"
            minH="50vh"
            spacing={8}
            filter={2 !== slide ? "opacity(0.5)" : "initial"}
          >
            <HStack justify="space-between">
              <Heading size="2xl">Bucket</Heading>
              <Clean what="bucket" />
            </HStack>
            <Bucket />
          </VStack>
        </SwiperSlide>
      </Swiper>

      <ReloadPrompt />
    </Flex>
  );
}

export default App;

const usePersistedTab = () => {
  const tabState = useState(Number(localStorage.getItem("current-tab")) ?? 0);

  const [tab, setTab] = tabState;

  useEffect(() => {
    localStorage.setItem("current-tab", tab.toString());
  }, [tab]);

  return tabState;
};
