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
            filter="saturate(0.5)"
            backgroundSize="contain"
            backgroundBlendMode="multiply"
            transition="all .5s ease-in"
          />
        </SliderTrack>
      </Slider>
    );
  }

  return (
    <Slider focusThumbOnChange={false} {...partialProps} {...restProps}>
      <SliderTrack
        minHeight=".75rem"
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
          sx={{
            maskImage: `url(/line2.svg)`,
            maskSize: "cover",
            bg: gradient,
          }}
          filter="initial"
          backgroundBlendMode="multiply"
          transition="all .5s ease-in"
        />
      </SliderTrack>
      <SliderThumb bg="rgba(240, 240, 240, 0.4)" boxSize={5} ml={-3} mt={-2}>
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
