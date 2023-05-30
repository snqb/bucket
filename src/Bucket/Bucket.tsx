import { Flex, VStack, Box, StackDivider } from "@chakra-ui/react";
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
    <VStack align="stretch" spacing={4} divider={<StackDivider />}>
      <Adder placeholder="slow things go here" where="bucket" />

      {state.bucket
        .filter((it) => it.residence !== "graveyard")
        .map((task, index) => {
          return (
            <BucketTask
              // minHeight="60vh"
              tabIndex={index}
              key={task.id}
              task={task}
              // filter={index !== slide ? "opacity(0.5)" : "initial"}
              transition="filter 0.2s"
            />
          );
        })}
    </VStack>
  );
};

export default Bucket;
