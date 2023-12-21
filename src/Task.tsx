import {
  AccordionItemProps,
  Button,
  Center,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure
} from "@chakra-ui/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLongPress } from "use-long-press";
import {
  Todo,
  TodoState,
  moveTask,
  removeTask,
  updateProgress,
  useAppDispatch,
  useAppSelector,
} from "./store";
interface Props extends AccordionItemProps {
  task: Todo;
  where: keyof TodoState;
  mode: "slow" | "fast";
}

export const Task = (props: Props) => {
  const { task, where, mode, ...restItemProps } = props;
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const hueref = useRef<number>();

  const [progress, setProgress] = useState(task.progress);
  const [startProgress, stop] = useAnimationFrame(() => {
    setProgress((progress) => progress + 1);
  });

  const stopProgress = useCallback(() => {
    stop();

    dispatch(
      updateProgress({
        key: where,
        id: task.id,
        progress,
      }),
    );
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
      }),
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
    >
      <HStack w="full" align="center" justify="space-between">
        <Title
          opacity={mode == "slow" ? 1 - progress / 110 : 1}
          onOpen={onOpen}
          title={task.title.emoji + "" + task.title.text}
          progress={progress}
        >
          {task.title.emoji}
          {task.title.text}
        </Title>
          <Button
            variant="outline"
            colorScheme="blue"
            filter={`saturate(${progress / 50})`}
            borderColor="gray.900"
            borderWidth="2px"
            p={1}
            {...bind()}
          >
            👊
          </Button>
        ) 
      </HStack>
      <Overlay isOpen={isOpen} onClose={onClose} {...props} />
    </VStack>
  );
};

type OverlayProps = any;

export const Overlay = ({
  isOpen,
  onClose,
  task,
  where,
}: Props & OverlayProps) => {
  const dispatch = useAppDispatch();
  const { structure } = useAppSelector((state) => state.todo);

  const handleMove = (screen: string) => {
    dispatch(
      moveTask({
        from: where,
        to: screen,
        id: task.id,
      }),
    );

    onClose();
  };

  return (
    <Modal
      isCentered
      motionPreset="none"
      size="xl"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay backdropFilter="blur(10px)" backdropBlur="1px" />
      <ModalContent bg="gray.900">
        <ModalHeader>
          <Heading as="h3" size="xl">
            {task.title.text}
          </Heading>
        </ModalHeader>
        <ModalBody>
          <VStack align="start">
            {structure.map((row, index) => {
              return (
                <HStack key={"qwe" + row[index]} flex={1} align="start">
                  {row.map((screen, index) => {
                    return (
                      <Button
                        variant="outline"
                        tabIndex={-1}
                        key={"ss" + index}
                        bg="blackAlpha.800"
                        color="white"
                        fontSize="sm"
                        isDisabled={screen === where}
                        sx={{
                          _disabled: {
                            bg: "blackAlpha.100",
                          },
                        }}
                        onClick={() => handleMove(screen)}
                      >
                        {screen === where ? (
                          <Center fontSize="large">⋒</Center>
                        ) : (
                          screen
                        )}
                      </Button>
                    );
                  })}
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" variant="outline" mr={3} onClick={onClose}>
            ✖️
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Title = ({ children, onOpen, progress, title, ...rest }: Props & OverlayProps) => {
  return (
    <Text
      w="100%"
      textAlign="left"
      as="span"
      fontSize="lg"
      fontWeight={500}
      onClick={onOpen}
      {...rest}
    >
      {children}{' '}
      <Text display="inline" color="gray.600" fontSize="sm">{progress}%</Text>
    </Text>
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

import { HTMLMotionProps, motion } from "framer-motion";

interface Props extends HTMLMotionProps<"div"> {
  text: string;
  delay?: number;
  duration?: number;
}

const MotionHeading = motion(Heading)






