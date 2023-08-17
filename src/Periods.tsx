import { Heading, StackDivider, VStack } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ShortTask } from "./Task";

import { Swiper, SwiperSlide } from "swiper/react";
import Adder from "./Adder";
import { TodoState, useAppSelector } from "./newStore";

const Days = ({ periods }: { periods: readonly (keyof TodoState)[] }) => {
  const tasks = useAppSelector((state) => state.todo);

  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

  return (
    <Swiper slidesPerView={1} loop direction="horizontal">
      {periods.map((period) => (
        <SwiperSlide style={{ width: "100vw", height: "100vh" }}>
          <VStack
            spacing={4}
            id="later"
            align="stretch"
            divider={<StackDivider borderColor="gray.800" />}
            ref={autoAnimate as any}
            maxHeight="77vh"
          >
            <Heading>{period}</Heading>

            <Adder placeholder="faster things..." where={period} />

            {tasks[period].map((task, index) => (
              <ShortTask key={task.id} task={task} where={period} />
            ))}
          </VStack>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default Days;
