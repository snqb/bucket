import {
  AccordionItemProps,
  Box,
  BoxProps,
  Button,
  Flex,
  HStack,
  Progress,
  Text,
  VStack,
  useBoolean,
  useDisclosure,
} from "@chakra-ui/react";
import { PlayIcon } from "@chakra-ui/icons";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLongPress } from "use-long-press";
import {
  Todo,
  TodoState,
  removeTask,
  updateProgress,
  useAppDispatch,
} from "./store";
import { Overlay } from "./Overlay";
import { motion, useCycle } from "framer-motion";
import { pipe } from "ramda";
import { FistButton } from "./FistButton";
export interface Props extends AccordionItemProps {
  task: Todo;
  where: keyof TodoState;
  mode: "slow" | "fast";
}

const MotionBox = motion(Box)

const variants = {
  jiggle: {
    x: [0, -5, 0, 5, 0], // Forward and backward movement
    // skewX: [0, 10, -10, 10, 0], // Bending effect
  },
  idle: {
    scale: 1,
    rotate: 0,
  },
};

export const Task = (props: Props) => {
  const { task, where, mode, ...restItemProps } = props;
  const dispatch = useAppDispatch();
  const { isOpen, onOpen: openMoverScreen, onClose } = useDisclosure();
  const hueref = useRef<number>();
  const [animateVariant, cycle] = useCycle("idle", "jiggle");
  const [isHolding, { on, off }] = useBoolean()

  const [progress, setProgress] = useState(task.progress);
  const [startProgress, stop] = useAnimationFrame(() => {
    setProgress((progress) => progress + 1);
    cycle();
    on()
  });

  const stopProgress = useCallback(() => {
    stop();
    off()

    dispatch(
      updateProgress({
        key: where,
        id: task.id,
        progress,
      })
    );
  }, [dispatch, updateProgress, hueref.current, progress]);

  const bind = useLongPress(() => { }, {
    onStart: pipe(startProgress),
    onCancel: stopProgress,
    onFinish: stopProgress,
    threshold: 100, // In milliseconds
  });

  const onRemoveClick = () => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      })
    );
  };

  useEffect(() => {
    if (progress > 100) {
      onRemoveClick();
    }
  }, [progress]);

  return (
    <VStack
      align="start"
      py={2}
      userSelect="none"
      {...restItemProps}
      spacing={0}
      filter={mode === "slow" ? `blur(${progress / 200}px)` : "none"}
      boxSizing="border-box"
    >

      <HStack w="full" align="center" justify="space-between">
        <MotionBox w="100%" textAlign="left" as="span" onClick={openMoverScreen}
          variants={variants}>
          <Text
            display="inline"
            fontSize="lg"
            opacity={1 - progress / 200}
            fontWeight={500}
          >
            {task.title.emoji}
            {task.title.text}
          </Text>
          <Text display="inline" color="gray.600" fontSize="sm">
            ({progress}%)
          </Text>
        </MotionBox>
        <FistButton
          progress={progress}
          as={motion.button}
          size="sm"
          w="42px"
          h="18px"
          variant="unstyled"
          display="flex"
          color="gray.100"
        // filter={`saturate(${progress / 50})`}
          borderColor="gray.900"
          borderWidth="2px"
          p={1}
          {...bind()}
        >
        </FistButton>
        )
      </HStack>
      <Overlay isOpen={isOpen} onClose={onClose} {...props} />
    </VStack>
  );
};


const useAnimationFrame = (callback: (time: number) => void) => {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      if (deltaTime > 20) {
        previousTimeRef.current = time;

        callback(deltaTime);
      }
    }
    if (!previousTimeRef.current) previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []); // Make sure the effect runs only once

  const stop = useCallback(() => cancelAnimationFrame(requestRef.current!), []);

  return [start, stop];
};
