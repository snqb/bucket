import {
  AccordionButton,
  AccordionItem,
  AccordionItemProps,
  AccordionPanel,
  Box,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { forwardRef, useMemo, useState } from "react";
import { ResizableTextarea } from "./ResizableTextarea";

interface Props extends AccordionItemProps {
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

    const [progress, setProgress] = useState(task.progress ?? 0);

    const gradient = useMemo(() => getRandomGradient(), []);

    const onProgress = (progress: number) => {
      setProgress(progress);
      saveProgress(task, progress);

      if (progress === 100) {
        killIt(task);
      }
    };

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
          <>
            <Text>
              <AccordionButton p={0}>
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
              mt={isExpanded ? 3 : 0}
              aria-label={`progress of ${task.title.text}`}
              defaultValue={progress}
              onChange={onProgress}
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
                bg="#ebebeb"
                // I really like how shitty this line of code is, so I'm gonna keep it
                height={`${isExpanded ? 10 : 3}px`}
              >
                <SliderFilledTrack bg={gradient} />
              </SliderTrack>
              {isExpanded && (
                <SliderThumb bg="transparent" mt={-1} boxSize={10}>
                  🪣
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
          </>
        )}
      </AccordionItem>
    );
  }
);

export default Task;

const randomColor = () => {
  // biased towards bluer values
  const R = Math.floor(Math.random() * 256) / 1.5;
  const G = Math.floor(Math.random() * 256) / 10;
  const B = Math.floor(Math.random() * 256);

  return `rgb(${R}, ${G}, ${B})`;
};

const getRandomGradient = () => {
  const first = randomColor();
  const second = randomColor();

  return `linear-gradient(to right, ${first}, ${second})`;
};
