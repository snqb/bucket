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
} from "@chakra-ui/react";

interface Props extends SliderProps {
  isExpanded: boolean;
  emoji?: string;
  huy?: string;
}

export const Progress = (props: Props) => {
  const { isExpanded, emoji = "🏊‍♀️", huy, value = 0, ...restProps } = props;

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
      filter={value === 100 ? "opacity(0.2)" : "initial"}
    >
      <SliderTrack
        minH="1rem"
        h="3vmin"
        sx={{
          maskImage: `url(/line2.svg)`,
          maskSize: "cover",
        }}
        mt={0}
      >
        <SliderFilledTrack
          minHeight="100%"
          minH="1rem"
          h="3vw"
          sx={{
            maskImage: `url(/line2.svg)`,
            maskSize: "cover",
            bg: "linear-gradient(to right, #33ccee, #00b7f2, #00a0f4, #0086f0, #0069e3);",
          }}
          backgroundBlendMode="multiply"
          transition="width .3s ease-out"
          willChange="width"
          filter="initial"
        />
      </SliderTrack>
      <SliderMark
        filter={value < 100 ? "opacity(0.4)" : "initial"}
        value={-(100 - value)}
        sx={S.markTitle}
        top={-1}
      >
        <Box>
          <Box as="span" filter="grayscale(100%)">
            {emoji}
          </Box>
          <Box as="span" textDecoration="line-through">
            {huy}
          </Box>
        </Box>
      </SliderMark>
      <SliderThumb
        pointerEvents="auto"
        h="fit-content"
        top={3}
        bg="blackAlpha.900"
        w="fit-content"
        overflowX="hidden"
        left={
          value > 80
            ? `calc(${value}% - 24px) !important`
            : `${value}% !important`
        }
      >
        <Flex fontSize="xl" color="white" gap={1}>
          <Box>{emoji}</Box>

          <Box w="max-content" sx={S.markTitle}>
            {huy}
          </Box>
        </Flex>
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
