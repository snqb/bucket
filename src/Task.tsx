import {
  AccordionItemProps,
  Box,
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
  VStack,
  useDisclosure,
} from "@chakra-ui/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLongPress } from "use-long-press";
import FistButton from "./FistButton";
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

  const addSome = useCallback(() => {
    setProgress((progress) => progress + 1);

    if (hueref.current) cancelAnimationFrame(hueref.current);
    hueref.current = requestAnimationFrame(addSome);
  }, [task.progress, where, task.id]);

  const stopProgress = useCallback(() => {
    if (hueref.current) {
      cancelAnimationFrame(hueref.current);
    }
    dispatch(
      updateProgress({
        key: where,
        id: task.id,
        progress,
      }),
    );
  }, [dispatch, updateProgress, hueref.current]);

  const bind = useLongPress(console.log, {
    onStart: () => {
      hueref.current = requestAnimationFrame(addSome);
    },
    onCancel: stopProgress,
    onFinish: stopProgress,
    onMove: () => {
      console.log("move");
    },
    threshold: 500, // In milliseconds
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
        >
          {task.title.emoji}
          {task.title.text}
          {mode === "slow" && `(${progress}%)`}
        </Title>
        {mode === "slow" ? (
          <FistButton
            // border="4px solid gray"
            filter={`saturate(${progress / 50})`}
            {...bind()}
          >
            🌊
          </FistButton>
        ) : (
          <FistButton onClick={onRemoveClick}>👊</FistButton>
        )}
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

const Title = ({ children, onOpen, ...rest }: Props & OverlayProps) => (
  <Box
    w="100%"
    textAlign="left"
    as="span"
    fontSize="lg"
    fontWeight={500}
    onClick={onOpen}
    {...rest}
  >
    {children}
  </Box>
);
