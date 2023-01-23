import {
  AccordionButton,
  AccordionItem,
  AccordionItemProps,
  AccordionPanel,
  Box,
  BoxProps,
  IconButton,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";

import { useDebouncedCallback } from "use-debounce";
import { store, Thingy } from "../store";
import { ResizableTextarea } from "./ResizableTextarea";

interface Props extends AccordionItemProps {
  task: Thingy;
  hasShuffler?: boolean; // yup this sucks
  onShuffleClick?: () => void;
}

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

const gradientColors = [
  "#00C6FB",
  "#3DBBFF",
  "#6CADFF",
  "#979DFC",
  "#BA8BEA",
  "#C783DE",
  "#D778CF",
  "#E965AD",
  "#F15787",
  "#ED525F",
  "#DF5737",
];

const Task = ({
  task,
  hasShuffler = false,
  onShuffleClick,
  ...restItemProps
}: Props) => {
  const state = useSyncedStore(store);

  const thingy = state.bucket.find((it) => it.id === task.id);

  const onProgress = useDebouncedCallback((progress: number) => {
    const thingy = state.bucket.find((it) => it.id === task.id);
    if (!thingy) return;
    thingy.progress = progress;
    if (progress > 98) {
      thingy.residence = "graveyard";
    }
  }, 350);

  if (!thingy) {
    return null;
  }
  return (
    <AccordionItem
      p={0}
      border="none"
      borderRadius="lg"
      userSelect="none"
      textTransform="lowercase"
      {...restItemProps}
    >
      {({ isExpanded }) => {
        const whichColor = gradientColors[Math.ceil(thingy.progress / 10)];

        const expandedProps = isExpanded
          ? {
              pb: 12,
              pt: 2,
              px: 4,
              background: whichColor + "40",
              mb: 6,
            }
          : {};

        return (
          <Box {...expandedProps} sx={{ transition: "all .1s linear" }}>
            {/* <Box position="relative">{task.title.emoji}</Box> */}
            <AccordionButton p={0} fontWeight={500}>
              <EmojiThing mr={2} isTilted={isExpanded}>
                {task.title.emoji}
              </EmojiThing>
              <Text fontWeight={500} fontSize={isExpanded ? "2xl" : "medium"}>
                {task.title.text}
              </Text>
              {hasShuffler && (
                <IconButton
                  variant="ghost"
                  ml="auto"
                  aria-label={"🎲"}
                  icon={<>🎲</>}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShuffleClick?.();
                  }}
                />
              )}
            </AccordionButton>
            <Slider
              focusThumbOnChange={false}
              mt={isExpanded ? 6 : 0}
              aria-label={`progress of ${task.title.text}`}
              defaultValue={task.progress}
              onChange={onProgress}
              height="24px"
              pointerEvents={isExpanded ? "initial" : "none"}
              step={0.01}
            >
              <SliderTrack
                // css={isExpanded ? wavyMask : ""}
                bg={
                  isExpanded
                    ? `url(/wave3.png), var(--chakra-colors-gray-300)`
                    : "gray.200"
                }
                height={`${isExpanded ? 15 : 3}px`}
                backgroundSize="contain"
                backgroundBlendMode="multiply"
              >
                <SliderFilledTrack
                  bg={isExpanded ? `url(/wave3.png), ${gradient}` : gradient}
                  backgroundSize="contain"
                  backgroundBlendMode="multiply"
                />
              </SliderTrack>
              {isExpanded && (
                <SliderThumb
                  bg="rgba(240, 240, 240, 0.4)"
                  boxSize={8}
                  ml={-3}
                  mt={-2}
                >
                  <Box as="span" transform="scaleX(-1)">
                    🏊‍♀️
                  </Box>
                </SliderThumb>
              )}
            </Slider>
            <AccordionPanel px={0} pt={1} py={3}>
              <ResizableTextarea
                p={0}
                color="#bababa"
                variant="outline"
                defaultValue={task.description}
                focusBorderColor="transparent"
                placeholder="if you wanna put some more"
                border="none"
                onChange={(e) => {
                  thingy.description = e.target.value;
                }}
              />
            </AccordionPanel>
          </Box>
        );
      }}
    </AccordionItem>
  );
};

export default Task;

const EmojiThing = ({
  children,
  isTilted,
  ...props
}: BoxProps & { isTilted: boolean }) => {
  return (
    <Box
      as="span"
      transform={isTilted ? "rotate(45deg)" : "initial"}
      {...props}
    >
      {children}
    </Box>
  );
};

const x = `
  --mask: radial-gradient()
`;

const wavyMask = `
--mask: radial-gradient(
      21.09px at 50% calc(100% + 18px),
      #0000 calc(99% - 1px),
      #000 calc(101% - 1px) 99%,
      #0000 101%
    )
      calc(50% - 20px) calc(50% - 5.5px + 0.5px) / 40px 11px
    repeat-x,
  radial-gradient(
      21.09px at 50% -18px,
      #0000 calc(99% - 1px),
      #000 calc(101% - 1px) 99%,
      #0000 101%
    )
    50% calc(50% + 5.5px) / 40px 11px repeat-x;
-webkit-mask: var(--mask);
mask: var(--mask);
`;
