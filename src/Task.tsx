import {
  AccordionItemProps,
  Button,
  HStack,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLongPress } from "use-long-press";
import { mode$ } from "./App";
import { Overlay } from "./Overlay";
import {
  Todo,
  TodoState,
  removeTask,
  updateProgress,
  useAppDispatch,
} from "./store";
import { preventDrag$ } from "./Screen";

const MVStack = motion(VStack);
type H = ComponentProps<typeof MVStack>;

type Props = AccordionItemProps &
  H & {
    task: Todo;
    where: keyof TodoState;
  };

export const Task = (props: Props) => {
  const { task, where, ...restItemProps } = props;
  const dispatch = useAppDispatch();
  const { isOpen, onOpen: openMoverScreen, onClose } = useDisclosure();
  const hueref = useRef<number>();

  const [progress, setProgress] = useState(task.progress);
  const [start, stop] = useAnimationFrame(() => {
    setProgress((progress) => progress + 1);
  });

  const startProgress = useCallback(() => {
    start();
    preventDrag$.set(true);
  }, [start]);

  const stopProgress = useCallback(() => {
    preventDrag$.set(false);

    stop();
    dispatch(
      updateProgress({
        key: where,
        id: task.id,
        progress,
      })
    );

    return stop;
  }, [dispatch, updateProgress, hueref.current, progress]);

  const bind = useLongPress(() => {}, {
    onStart: startProgress,
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

  const zoomedOut = mode$.get() === 1;

  return (
    <MVStack
      align="start"
      py={2}
      userSelect="none"
      {...restItemProps}
      spacing={0}
      filter={`blur(${progress / 200}px)`}
      boxSizing="border-box"
    >
      <HStack w="full" align="center" justify="space-between">
        <HStack
          as={motion.div}
          w="100%"
          justify="space-between"
          onClick={openMoverScreen}
        >
          <Text
            display="inline"
            fontSize="lg"
            opacity={1 - progress / 200}
            fontWeight={500}
          >
            {task.title.emoji}
            {task.title.text}
          </Text>
        </HStack>
        <Text display="inline" color="gray.600" fontSize="sm">
          {progress}%
        </Text>
        {!zoomedOut && (
          <Button
            as={motion.button}
            whileTap={{ scale: 0.9 }}
            variant="outline"
            colorScheme="blue"
            filter={`hue-rotate(${-progress * 1}deg)`}
            borderColor="gray.900"
            borderWidth="2px"
            p={1}
            {...bind()}
          >
            👊
          </Button>
        )}
        )
      </HStack>
      <Overlay isOpen={isOpen} onClose={onClose} {...props} />
    </MVStack>
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
      if (deltaTime > 16) {
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
