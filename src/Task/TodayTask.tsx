import {
  AccordionItemProps,
  Box,
  BoxProps,
  Flex,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { useState } from "react";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { store, Thingy } from "../store";
import { Progress } from "./+progress";

interface Props extends AccordionItemProps {
  task: Thingy;
}

const TodayTask = ({ task, ...restItemProps }: Props) => {
  const thingy = useSyncedStore(store.today.find((it) => it.id === task.id)!);
  const [progress, onProgress] = useProgress(thingy!);

  if (!thingy) {
    return null;
  }

  return (
    <VStack
      align="start"
      p={0}
      userSelect="none"
      {...restItemProps}
      spacing={0}
    >
      <Box w="min-content" as="span" fontSize="xl" fontWeight={500}>
        {task.title.text}
      </Box>
      <Progress
        isExpanded
        // filter={`saturate(${(progress + 30) / 100})`}
        mt={0}
        aria-label={`progress of ${thingy.title.text}`}
        defaultValue={task.progress}
        onChange={onProgress}
        value={progress}
        height="16px"
        step={0.01}
        emoji={task.title.emoji}
      />
    </VStack>
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
