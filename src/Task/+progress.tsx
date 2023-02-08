import {
  Box,
  forwardRef,
  Slider,
  SliderFilledTrack,
  SliderProps,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";

interface Props extends SliderProps {
  isExpanded: boolean;
}

export const Progress = forwardRef<Props, "div">((props: Props, ref) => {
  const { isExpanded, ...restProps } = props;
  return (
    <Slider
      ref={ref}
      focusThumbOnChange={false}
      mt={isExpanded ? 6 : 0}
      pointerEvents={isExpanded ? "initial" : "none"}
      {...restProps}
    >
      <SliderTrack
        minHeight={isExpanded ? "1rem" : "initial"}
        bg={
          isExpanded
            ? `url(/wave3.png), var(--chakra-colors-gray-300)`
            : "rgba(25, 25, 25, 0.5)"
        }
        backgroundSize="contain"
        backgroundBlendMode="multiply"
        mt={isExpanded ? 0 : -2}
      >
        <SliderFilledTrack
          minHeight="100%"
          bg={isExpanded ? `url(/wave3.png), ${gradient}` : gradient}
          filter={isExpanded ? "initial" : "saturate(0.5)"}
          backgroundSize="contain"
          backgroundBlendMode="multiply"
          transition="all .5s ease-in"
        />
      </SliderTrack>
      {isExpanded && (
        <SliderThumb bg="rgba(240, 240, 240, 0.4)" boxSize={6} ml={-3} mt={-2}>
          <Box as="span" transform="scaleX(-1)">
            🏊‍♀️
          </Box>
        </SliderThumb>
      )}
    </Slider>
  );
});

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
