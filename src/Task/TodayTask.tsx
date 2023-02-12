import {
  AccordionItemProps,
  Box,
  BoxProps,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { useState } from "preact/hooks";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { store, Thingy } from "../store";
import { Progress } from "./+progress";

interface Props extends AccordionItemProps {
  task: Thingy;
}

const TodayTask = ({ task, ...restItemProps }: Props) => {
  const state = useSyncedStore(store.today);
  const thingy = state.find((it) => it.id === task.id);
  const [progress, onProgress] = useProgress(thingy!);

  if (!thingy) {
    return null;
  }
  const whichColor = gradientColors[Math.ceil(thingy.progress / 10)];

  return (
    <Flex
      direction="column"
      align="start"
      p={0}
      border="none"
      borderRadius="lg"
      userSelect="none"
      textTransform="lowercase"
      isFocusable={false}
      {...restItemProps}
    >
      <Text p={0} mb={0} fontWeight={500} alignItems="baseline">
        {/* <EmojiThing mr={2}>{task.title.emoji}</EmojiThing> */}
        <Text fontSize="3xl" align="left" display="inline" fontWeight={500}>
          {task.title.text}
        </Text>
      </Text>
      <Progress
        isExpanded
        filter={`saturate(${(progress + 30) / 100})`}
        mt={0}
        aria-label={`progress of ${thingy.title.text}`}
        defaultValue={task.progress}
        onChange={onProgress}
        value={progress}
        height="16px"
        step={0.01}
        emoji={task.title.emoji}
      />
    </Flex>
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

export default TodayTask;

const EmojiThing = ({
  children,
  isTilted,
  ...props
}: BoxProps & { isTilted?: boolean }) => {
  return (
    <Box
      as="span"
      display="inline"
      transform={isTilted ? "rotate(45deg)" : "initial"}
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
