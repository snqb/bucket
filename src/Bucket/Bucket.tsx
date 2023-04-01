import { Flex, VStack, Box } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";
import { BucketTask } from "../Task/BucketTask";
import { useLocalStorageValue } from "../utils";

const Bucket = () => {
  const state = useSyncedStore(store);
  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });
  const [slide, setSlide] = useLocalStorageValue("bucket-slide", 0);

  return (
    <Flex direction="column" align="stretch" gap={6} overflowY="hidden">
      <Swiper
        style={{
          height: "77vh",
          width: "100%",
        }}
        direction="vertical"
        slidesPerView="auto"
        spaceBetween={16}
        centeredSlides
        autoHeight
        initialSlide={slide}
        onSlideChange={(it) => {
          setSlide(it.activeIndex);
        }}
      >
        {state.bucket
          .filter((it) => it.residence !== "graveyard")
          .map((task, index) => {
            return (
              <SwiperSlide key={task.id}>
                <BucketTask
                  minHeight="60vh"
                  tabIndex={index}
                  key={task.id}
                  task={task}
                  filter={index !== slide ? "opacity(0.5)" : "initial"}
                  transition="filter 0.2s"
                />
              </SwiperSlide>
            );
          })}
      </Swiper>

      <Adder placeholder="slow things go here" where="bucket" />
    </Flex>
  );
};

export default Bucket;
