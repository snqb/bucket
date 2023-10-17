import { Flex } from "@chakra-ui/react";

import { useEffect, useState } from "react";
import ReloadPrompt from "./ReloadPrompt";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Controller, EffectCube } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import Period from "./Period";
import { persistor, store } from "./store";
import Confetti from "./Confetti";

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Flex px={[5, 5, 10, 20, 300]} pt={10} maxW="500px" overflowY="hidden">
          <Swiper
            style={{
              height: "100vh",
              width: "100%",
            }}
            direction="vertical"
            slidesPerView={1}
            loop
          >
            <SwiperSlide>
              <Period
                row={0}
                periods={["today", "tomorrow", "someday"] as const}
              />
            </SwiperSlide>
            <SwiperSlide>
              <Period
                row={1}
                periods={["thisWeek", "nextWeek", "someWeek"] as const}
              />
            </SwiperSlide>
            <SwiperSlide>
              <Period
                row={2}
                periods={
                  ["otherThing", "anotherThing", "differentThing"] as const
                }
              />
            </SwiperSlide>
          </Swiper>

          <ReloadPrompt />
        </Flex>
      </PersistGate>
    </Provider>
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
