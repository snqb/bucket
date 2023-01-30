import {
  AccordionButton,
  AccordionItem,
  AccordionItemProps,
  AccordionPanel,
  Box,
  BoxProps,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { useState } from "preact/hooks";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { store, Thingy } from "../store";
import { ResizableTextarea } from "./ResizableTextarea";

interface Props extends AccordionItemProps {
  task: Thingy;
  where?: "today" | "bucket";
}

const Task = ({ task, where = "bucket", ...restItemProps }: Props) => {
  const state = useSyncedStore(store[where]);
  const thingy = state.find((it) => it.id === task.id);
  const [progress, onProgress] = useProgress(thingy!);

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
      isFocusable={false}
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
            <AccordionButton p={0} fontWeight={500} alignItems="baseline">
              <EmojiThing mr={2} isTilted={isExpanded}>
                {task.title.emoji}
              </EmojiThing>
              <Text
                align="left"
                fontWeight={500}
                fontSize={isExpanded ? "2xl" : "medium"}
              >
                {task.title.text}
              </Text>
            </AccordionButton>
            <Slider
              focusThumbOnChange={false}
              mt={isExpanded ? 6 : 0}
              aria-label={`progress of ${task.title.text}`}
              defaultValue={task.progress}
              onChange={onProgress}
              value={progress}
              height="24px"
              pointerEvents={isExpanded ? "initial" : "none"}
              step={0.01}
            >
              <SliderTrack
                // css={isExpanded ? wavyMask : ""}
                bg={
                  isExpanded
                    ? `url(/wave3.png), var(--chakra-colors-gray-300)`
                    : "rgba(25, 25, 25, 0.5)"
                }
                height={`${isExpanded ? 15 : 4}px`}
                backgroundSize="contain"
                backgroundBlendMode="multiply"
                mt={-1}
              >
                <SliderFilledTrack
                  bg={isExpanded ? `url(/wave3.png), ${gradient}` : gradient}
                  filter={isExpanded ? "initial" : "saturate(0.5)"}
                  backgroundSize="contain"
                  backgroundBlendMode="multiply"
                  transition="all .5s ease-in"
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

const useProgress = (thingy: Thingy): [number, (value: number) => void] => {
  const [progress, setProgress] = useState(thingy.progress ?? 0);

  const updateStoreProgress = useDebouncedCallback((progress: number) => {
    thingy.progress = progress;
    // 98 because why not
    if (progress > 98) {
      thingy!.residence = "graveyard";
    }
  }, 1000);

  useEffect(
    function updateLocalVariableFromRemote() {
      if (thingy.progress) {
        setProgress(thingy.progress);
      }
    },
    [thingy.progress]
  );

  const onProgress = (value: number) => {
    setProgress(value);
    updateStoreProgress(value);
  };

  return [progress, onProgress];
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
