import {
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  StackDivider,
  VStack,
  Text,
  Center,
  Flex,
  Divider,
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { ShortTask } from "./Task";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import Adder, { getRandomEmoji } from "./Adder";
import { PERIODS, PERIOD_TEXTS } from "./constants";
import { TodoState, horizontalIndex, useAppSelector } from "./store";
import { AutoTextSize } from "auto-text-size";
import { motion } from "framer-motion";
import EmojiSpawner from "./Confetti";
interface Props {
  periods: readonly (keyof TodoState)[];
  row: number;
}

const Period = ({ periods, row }: Props) => {
  const tasks = useAppSelector((state) => state.todo);
  const [controller, setController] = useState<SwiperClass>();

  const [autoAnimate] = useAutoAnimate({ duration: 250, easing: "linear" });

  useEffect(() => {
    const timerId = requestAnimationFrame(() =>
      controller?.slideToLoop(horizontalIndex.value, 0, false),
    );

    return () => cancelAnimationFrame(timerId);
  }, [horizontalIndex.value]);

  return (
    <Swiper
      slidesPerView={1}
      loop
      onSlideChange={(it) => {
        horizontalIndex.value = it.realIndex;
      }}
      onSwiper={setController}
      direction="horizontal"
      initialSlide={horizontalIndex.value}
    >
      {periods.map((period, index) => (
        <SwiperSlide key={period} style={{ width: "100vw", height: "100vh" }}>
          <VStack
            spacing={2}
            id="later"
            align="stretch"
            divider={
              <StackDivider borderStyle="dotted" borderColor="gray.800" />
            }
            ref={autoAnimate as any}
            maxHeight="77vh"
          >
            <HStack>
              <Grid
                w="22px"
                h="22px"
                templateColumns="repeat(3, 1fr)"
                gap={0.5}
              >
                {PERIODS.map((it, current) => (
                  <Box
                    key={it}
                    borderRadius="50%"
                    bg={current === row * 3 + index ? "white" : "gray.500"}
                  />
                ))}
              </Grid>
              <Heading>{PERIOD_TEXTS[period]}</Heading>
            </HStack>
            <Adder placeholder="faster things..." where={period} />

            {tasks[period].map((task, index) => (
              <ShortTask key={task.id} task={task} where={period} />
            ))}
          </VStack>
          <Flex
            flexWrap="wrap"
            position="fixed"
            bottom="10%"
            width="full"
            gap={1}
            _hover={{
              bg: "inherit",
            }}
            sx={{
              WebkitTapHighlightColor: "transparent",
            }}
            flex="0 1 fit-content"
          >
            <Divider mb={2} />

            <CircleText text="milk a cow" />
            <CircleText text="work out" />
            {/* <CircleText text="work an hour with" /> */}
            <CircleText text="pages" />
            <CircleText text="yoga" />
          </Flex>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default Period;

interface CircleTextProps {
  text: string;
}

const CircleText: React.FC<CircleTextProps> = ({ text }) => {
  const [emoji] = useState(getRandomEmoji());
  const [number, setNumber] = useState(0);

  return (
    <EmojiSpawner>
      <Button
        variant="solid"
        w="fit-content"
        bg="blackAlpha.900"
        onClick={() => setNumber((it) => it + 1)}
        filter="saturate(.8)"
        _active={huemoe}
        _hover={huemoe}
        userSelect="none"
        display="flex"
        alignItems="center"
        p={1}
        gap={1}
      >
        <Box fontSize="1.5rem">{emoji}</Box>
        <Box text-textAlign="left">
          <AutoTextSize
            style={{ textAlign: "left" }}
            mode="box"
            minFontSizePx={11}
            maxFontSizePx={14}
          >
            {text}
          </AutoTextSize>
        </Box>
        <MotionBox
          background="gray.700"
          borderRadius="50%"
          p={1}
          fontSize="12px"
          minW="4ch"
          textAlign="center"
          fontWeight="bold"
          h="auto"
          key={number}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
          border="1px solid gray.200"
        >
          {number}
        </MotionBox>
      </Button>
    </EmojiSpawner>
  );
};

const MotionBox = motion(Box);

const huemoe = {
  bg: "gray.900",
  transition: "all 1.5s",
  filter: "saturate(1)",
  opacity: 1,
  outline: "none",
};
