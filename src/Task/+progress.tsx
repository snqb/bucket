import {
  Box,
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
import Task from ".";

interface Props extends SliderProps {
  isExpanded: boolean;
  emoji?: string;
  text?: string;
}

export const Progress = (props: Props) => {
  const { isExpanded, emoji = "🏊‍♀️", text, value = 0, ...restProps } = props;

  const partialProps: any = {
    pointerEvents: isExpanded ? "initial" : "none",
  };

  if (!isExpanded) {
    return (
      <Slider focusThumbOnChange={false} {...partialProps} {...restProps}>
        <SliderTrack
          bg="rgba(25, 25, 25, 0.5)"
          backgroundSize="contain"
          backgroundBlendMode="multiply"
          mt={-2}
        >
          <SliderFilledTrack
            minHeight="100%"
            bg={gradient}
            backgroundSize="contain"
            backgroundBlendMode="multiply"
            transition="all .5s ease-in"
          />
        </SliderTrack>
      </Slider>
    );
  }

  return (
    <Slider
      focusThumbOnChange={false}
      {...partialProps}
      {...restProps}
      pointerEvents="none"
      overflow="hidden"
      // filter={value === 100 ? "opacity(0.5)" : "initial"}
      // opacity={`-(${-((100 - value) * 2)}%`}
    >
      <SliderTrack
        minH=".6rem"
        sx={{
          maskImage: `url(/line2.svg)`,
          // bg: "linear-gradient(to right, #33ccee3A, #00b7f23A, #00a0f43A, #0086f03A, #0069e33A);",
          maskSize: "cover",
          bg: "blackAlpha.900",
        }}
        mt={0}
      >
        <SliderFilledTrack
          minHeight="100%"
          minH=".6rem"
          h="3vw"
          sx={{
            // maskImage: `url(/line2.svg)`,
            maskSize: "cover",
            bg: "white",

            // bg: "linear-gradient(to right, #33ccee, #00b7f2, #00a0f4, #0086f0, #0069e3);",
          }}
          backgroundBlendMode="multiply"
          transition="width .3s ease-out"
          willChange="width"
          filter="initial"
        />
      </SliderTrack>
      <SliderThumb
        pointerEvents="auto"
        bg="blackAlpha.600"
        ml={2}
        boxSize={8}
        mt={-3}
      >
        <Box as="span" transform="scaleX(-1)">
          {emoji}
        </Box>
      </SliderThumb>
    </Slider>
  );
};

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
