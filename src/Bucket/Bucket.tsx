import { Flex } from "@chakra-ui/react";
import { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

import "./bullets.css";

import { useSyncedStore } from "@syncedstore/react";

import Adder from "../Adder";
import { store } from "../store";
import { BucketTask } from "../Task/BucketTask";
import { useLocalStorageValue } from "../utils";

const Bucket = () => {
  const state = useSyncedStore(store);
  const [slide, setSlide] = useLocalStorageValue("bucket-slide", 0);

  return (
    <Flex direction="column" align="stretch" gap={2} overflowY="hidden">
      <Adder placeholder="slow things go here" where="bucket" />

      <Swiper
        modules={[Pagination]}
        style={{
          height: "50vh",
          width: "100%",
        }}
        effect="cube"
        direction="horizontal"
        slidesPerView={1}
        cssMode
        initialSlide={slide}
        onSlideChange={(it) => {
          setSlide(it.activeIndex);
        }}
        pagination={{
          enabled: true,
          type: "bullets",
          dynamicBullets: true,
        }}
      >
        {state.bucket
          .filter((it) => it.residence !== "graveyard")
          .map((task, index) => {
            return (
              <SwiperSlide key={task.id}>
                <BucketTask
                  minH="55vh"
                  bg="whiteAlpha.100"
                  key={task.id}
                  task={task}
                  filter={index !== slide ? "opacity(0.5)" : "initial"}
                  transition="filter 0.2s"
                />
              </SwiperSlide>
            );
          })}
      </Swiper>
    </Flex>
  );
};

export default Bucket;
