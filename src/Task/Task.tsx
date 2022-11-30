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
import { ITask, useTasks } from "../data/useTasks";

import { useEffect, useRef, useState } from "react";
import { ResizableTextarea } from "./ResizableTextarea";
import { useDebouncedCallback } from "use-debounce";

interface Props extends AccordionItemProps {
  task: ITask;
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
  #DF5737)`;

const Task = ({
  task,
  hasShuffler = false,
  onShuffleClick,
  ...restItemProps
}: Props) => {
  const { killIt, saveProgress, describe } = useTasks();

  const [progress, setProgress] = useState(task.progress ?? 0);

  const onProgress = useDebouncedCallback((progress: number) => {
    setProgress(progress);
    saveProgress(task, progress);

    if (progress === 100) {
      killIt(task);
    }
  }, 100);

  return (
    <AccordionItem
      p={0}
      border="none"
      borderRadius="lg"
      userSelect="none"
      textTransform="lowercase"
      {...restItemProps}
    >
      {({ isExpanded }) => (
        <Box py={isExpanded ? 4 : 0}>
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
            defaultValue={progress}
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
              // borderRadius="4px"
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
              fontSize="smaller"
              color="#bababa"
              variant="outline"
              defaultValue={task.description}
              focusBorderColor="transparent"
              placeholder="if you wanna put some more"
              border="none"
              onChange={(e) => describe(task, e.target.value)}
            />
          </AccordionPanel>
        </Box>
      )}
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

const useAnimationFrame = (callback: any) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = (time: number) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current);
    };
  }, []);
};
