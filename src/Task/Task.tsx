import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  ListItemProps,
  Progress,
  ScaleFade,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { forwardRef, useRef, useState } from "react";
import { mergeRefs } from "react-merge-refs";
import useDoubleClick from "use-double-click";
import { ResizableTextarea } from "./ResizableTextarea";

interface Props extends ListItemProps {
  task: ITask;
  canMoveUp?: boolean;
  highlighted?: boolean;
}

const Task = forwardRef(
  (
    { task, canMoveUp = false, highlighted = false, ...restItemProps }: Props,
    ref: any
  ) => {
    const {
      killIt,
      moveToToday,
      moveToBucketFromToday,
      isToday,
      saveProgress,
      describe,
    } = useTasks();
    // these two below are for dark mode
    const bgEmptyBar = useColorModeValue(
      "var(--chakra-colors-gray-50)",
      "var(--chakra-colors-gray-900)"
    );
    const bgFullBar = useColorModeValue("#5ABCEE", "#2C65AE");
    const [description, setDescription] = useState(task.description ?? "");

    const taskRef = useRef(ref);

    const {
      isOpen,
      onClose: closeSlider,
      onOpen: openSlider,
    } = useDisclosure({
      defaultIsOpen: false,
      onClose: () => {
        saveProgress(task, progress);
        describe(task, description);
      },
    });
    const [progress, setProgress] = useState(task.progress ?? 0);

    useDoubleClick({
      onSingleClick: openSlider,
      onDoubleClick: () => {
        if (isToday(task)) {
          moveToBucketFromToday(task);
        } else {
          moveToToday(task);
        }
      },
      ref: taskRef,
      latency: 200,
    });

    const onProgress = (progress: number) => {
      setProgress(progress);

      if (progress === 100) {
        killIt(task);
      }
    };

    console.log(task);

    return (
      <AccordionItem
        ref={mergeRefs([ref, taskRef])}
        p={0}
        border="none"
        borderRadius="lg"
        userSelect="none"
        textTransform="lowercase"
        {...restItemProps}
      >
        {({ isExpanded }) => (
          <>
            <Text>
              <AccordionButton p={1}>
                {isExpanded ? (
                  <Box as="span" transform="rotate(45deg)">
                    {task.title.emoji}
                  </Box>
                ) : (
                  <Box as="span">{task.title.emoji}</Box>
                )}
                <Box mr={1} />
                {task.title.text}
              </AccordionButton>
            </Text>
            <ScaleFade reverse initialScale={0} in={!isExpanded}>
              <Progress
                isAnimated={false}
                height="1px"
                mt={2}
                colorScheme="blue"
                size="xs"
                value={progress}
              />
            </ScaleFade>
            <ScaleFade reverse initialScale={0} in={isExpanded}>
              <Slider
                aria-label={`progress of ${task.title.text}`}
                defaultValue={progress}
                onChangeEnd={onProgress}
                height="16px"
              >
                <SliderTrack
                  css={`
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
                  `}
                  bg="blue.200"
                  height="10px"
                >
                  <SliderFilledTrack bg="blue.600" />
                </SliderTrack>
                <SliderThumb mt={-1} boxSize={5}>
                  🚢
                </SliderThumb>
              </Slider>
            </ScaleFade>

            <AccordionPanel px={0} py={2}>
              <ResizableTextarea
                variant="outline"
                defaultValue={task.description}
                focusBorderColor="transparent"
                placeholder="if you wanna put some more"
                p={0}
                border="none"
                onChange={(e) => describe(task, e.target.value)}
              />
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    );
  }
);

export default Task;
