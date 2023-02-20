import {
  Box,
  Slider,
  SliderFilledTrack,
  SliderProps,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";

interface Props extends SliderProps {
  isExpanded: boolean;
  emoji?: string;
}

export const Progress = (props: Props) => {
  const { isExpanded, emoji = "🏊‍♀️", ...restProps } = props;

  const partialProps: any = {
    mt: isExpanded ? 6 : 0,
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
    >
      <SliderTrack
        minHeight=".75rem"
        h="3vw"
        sx={{
          maskImage: `url(/line2.svg)`,
          maskSize: "cover",
          // bg: '#0074ba88 ',
        }}
        backgroundBlendMode="multiply"
        mt={0}
      >
        <SliderFilledTrack
          minHeight="100%"
          h="3vw"
          sx={{
            maskImage: `url(/line2.svg)`,
            maskSize: "cover",
            bg: gradient,
          }}
          filter="initial"
          backgroundBlendMode="multiply"
          transition="width .3s ease-out"
          willChange="width"
        />
      </SliderTrack>
      <SliderThumb
        pointerEvents="auto"
        bg="blackAlpha.900"
        boxSize={10}
        ml={-3}
        mt={-2}
      >
        <Box as="span" transform="scaleX(-1)">
          {emoji}
        </Box>
      </SliderThumb>
    </Slider>
  );
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
