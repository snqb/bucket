import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  ListItemProps,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { forwardRef, useState } from "react";
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

    const onProgress = (progress: number) => {
      setProgress(progress);

      if (progress === 100) {
        killIt(task);
      }
    };

    console.log(task);

    return (
      <AccordionItem
        p={0}
        border="none"
        borderRadius="lg"
        userSelect="none"
        textTransform="lowercase"
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
            <Slider
              mt={isExpanded ? 3 : 1}
              aria-label={`progress of ${task.title.text}`}
              defaultValue={progress}
              onChangeEnd={onProgress}
              height="16px"
              pointerEvents={isExpanded ? "initial" : "none"}
              step={5}
            >
              <SliderTrack
                css={
                  isExpanded
                    ? `
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
                `
                    : ""
                }
                bg="blue.200"
                // I really like how shitty this line of code is, so I'm gonna keep it
                height={`1${isExpanded ? "0" : ""}px`}
              >
                <SliderFilledTrack bg="blue.600" />
              </SliderTrack>
              {isExpanded && (
                <SliderThumb
                  mt={progress % 10 === 0 ? -1 : 1}
                  boxSize={5}
                  transition="margin 500ms ease-in-out"
                >
                  🚢
                </SliderThumb>
              )}
            </Slider>
            <AccordionPanel px={0} pt={2} py={3}>
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
