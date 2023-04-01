import {
  AccordionButton,
  AccordionItem,
  AccordionItemProps,
  AccordionPanel,
  Box,
  BoxProps,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightAddon,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import { useSyncedStore } from "@syncedstore/react";
import { useState } from "react";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { getRandomEmoji } from "../Adder/Adder";
import { store, Thingy } from "../store";
import { Progress } from "./+progress";
import { ResizableTextarea } from "./+resizable-textarea";

interface Props extends AccordionItemProps {
  task: Thingy;
  showFooter?: boolean;
}

export const BucketTask = ({
  task,
  showFooter = false,
  ...restItemProps
}: Props) => {
  const state = useSyncedStore(store.bucket);
  const thingy = state.find((it) => it.id === task.id);
  const [progress, onProgress] = useProgress(thingy!);
  const today = useSyncedStore(store.today);

  if (!thingy) {
    return null;
  }

  const whichColor = gradientColors[Math.ceil(thingy.progress / 10)];

  const expandedProps = {
    pb: 6,
    pt: 2,
    px: 4,
    background: whichColor + "25",
    w: "full",
  };

  return (
    <Flex
      direction="column"
      p={0}
      borderRadius="lg"
      gap={2}
      userSelect="none"
      {...restItemProps}
      {...expandedProps}
    >
      <Box textAlign="left" as="span" fontSize="xl" fontWeight={500}>
        {task.title.emoji} {task.title.text}
      </Box>

      <Progress
        p={0}
        aria-label={`progress of ${thingy.title.text}`}
        isExpanded={true}
        defaultValue={task.progress}
        onChange={onProgress}
        value={progress}
        step={0.01}
        emoji="●"
      />

      <ResizableTextarea
        isExpanded={false}
        color="#bababa"
        variant="outline"
        defaultValue={task.description}
        focusBorderColor="transparent"
        placeholder="..."
        border="none"
        onChange={(e) => {
          thingy.description = e.target.value;
        }}
      >
        <InputGroup size="sm">
          <InputLeftAddon opacity={0.5}>next: </InputLeftAddon>
          <Input
            value={thingy.next ?? ""}
            onInput={(e) => {
              thingy.next = e.currentTarget.value;
            }}
            placeholder=".."
          />
          <InputRightAddon
            ml={3}
            onClick={() => {
              if (!thingy.next) return;
              today.push({
                id: crypto.randomUUID(),
                title: {
                  text: thingy.next,
                  emoji: getRandomEmoji(),
                },
                createdAt: new Date(),
                progress: 10,
                residence: "default",
              });
              thingy.next = "";
            }}
          >
            ➡️
          </InputRightAddon>
          {/* <InputRightAddon>→</InputRightAddon> */}
        </InputGroup>
      </ResizableTextarea>
      {showFooter && (
        <Box
          mt="auto"
          opacity={0.5}
          textAlign="left"
          as="span"
          fontSize="xl"
          fontWeight={500}
        >
          {task.title.emoji} {task.title.text}
        </Box>
      )}
    </Flex>
  );
};

const useProgress = (thingy: Thingy): [number, (value: number) => void] => {
  const [progress, setProgress] = useState(thingy.progress ?? 0);

  const updateStoreProgress = useDebouncedCallback((progress: number) => {
    thingy.progress = progress;
  }, 1000);

  useEffect(
    function updateLocalVariableFromRemote() {
      if (thingy.progress && thingy.progress !== progress) {
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
