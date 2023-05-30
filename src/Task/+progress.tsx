import {
  Box,
  css,
  Flex,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderProps,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import Task from ".";

interface Props extends SliderProps {
  emoji?: string;
  text?: string;
}

export const Progress = (props: Props) => {
  const { emoji = "🏊‍♀️", text, ...restProps } = props;

  return (
    <Slider
      focusThumbOnChange={false}
      {...restProps}
      pointerEvents="none"
      overflow="hidden"
      variant="wavy"
    >
      <SliderTrack
        minH=".6rem"
        sx={{
          maskImage: `url(/line2.svg)`,
        }}
        mt={0}
      >
        <SliderFilledTrack
          minHeight="100%"
          minH="1rem"
          h="3vw"
          w="100%"
          transition="width .3s ease-out"
          willChange="width"
          bg="gray.300"
        />
      </SliderTrack>
      <SliderThumb
        pointerEvents="auto"
        bg="blackAlpha.600"
        ml={2}
        boxSize={8}
        mt={-3}
      >
        <Box as="span" transform={`translateX(${getWaveOffset(10)})`}>
          {emoji}
        </Box>
      </SliderThumb>
    </Slider>
  );
};

function getWaveOffset(x: number) {
  const frequency = 0.03;
  const amplitude = 10;
  const phase = -0.5 * Math.PI;

  return amplitude * Math.sin(frequency * x + phase);
}
const S = {
  markTitle: {
    fontWeight: 500,
    fontSize: "xl",
  },
};

const gradient = `linear-gradient(to right, 
  #00C6FB, 
  #3DBBFF, 
  #6CADFF, 
  #979DFC, 
  #BA8BEA,
  #C783DE,
  #D778CF,
  #E965AD,
  #F15787,
  #ED525F,
  #DF5737
  )`;
