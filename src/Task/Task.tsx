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
import { ITask, useTasks } from "../data/useTasks";

import { forwardRef, useState } from "react";
import { ResizableTextarea } from "./ResizableTextarea";

interface Props extends AccordionItemProps {
  task: ITask;
  canMoveUp?: boolean;
  highlighted?: boolean;
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

const Task = forwardRef(
  (
    { task, canMoveUp = false, highlighted = false, ...restItemProps }: Props,
    ref: any
  ) => {
    const { killIt, saveProgress, describe } = useTasks();

    const [progress, setProgress] = useState(task.progress ?? 0);

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
          <Box py={isExpanded ? 4 : 0}>
            <AccordionButton p={0} fontWeight={500}>
              <EmojiThing mr={2} isTilted={isExpanded}>
                {task.title.emoji}
              </EmojiThing>
              <Text fontWeight={500}>{task.title.text}</Text>
            </AccordionButton>
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
                css={isExpanded ? wavyMask : ""}
                bg="#ebebeb"
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
          </Box>
        )}
      </AccordionItem>
    );
  }
);

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
