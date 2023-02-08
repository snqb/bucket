import {
  AccordionButton,
  AccordionItem,
  AccordionItemProps,
  AccordionPanel,
  Box,
  BoxProps,
  Text,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { useState } from "preact/hooks";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { store, Thingy } from "../store";
import { Progress } from "./+progress";
import { ResizableTextarea } from "./+resizable-textarea";

interface Props extends AccordionItemProps {
  task: Thingy;
}

export const BucketTask = ({ task, ...restItemProps }: Props) => {
  const state = useSyncedStore(store.bucket);
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
              h: "50vh",
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
            <Progress
              aria-label={`progress of ${thingy.title.text}`}
              isExpanded={isExpanded}
              defaultValue={task.progress}
              onChange={onProgress}
              value={progress}
              step={0.01}
            />
            <AccordionPanel px={0} pt={1} py={3}>
              <ResizableTextarea
                isExpanded={isExpanded}
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

const EmojiThing = ({
  children,
  isTilted,
  ...props
}: BoxProps & { isTilted: boolean }) => {
  return (
    <Box
      as="span"
      transform={isTilted ? "rotate(45deg)" : "initial"}
      fontSize="xs"
      {...props}
    >
      {children}
    </Box>
  );
};

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
