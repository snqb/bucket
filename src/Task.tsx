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
    setProgress((progress) => progress + 0.88);

    if (hueref.current) cancelAnimationFrame(hueref.current);
    hueref.current = requestAnimationFrame(addSome);
  }, [task.progress, where, task.id]);

  const bind = useLongPress(() => {}, {
    onStart: () => {
      hueref.current = requestAnimationFrame(addSome);
    },
    onCancel: () => {
      if (hueref.current) {
        cancelAnimationFrame(hueref.current);
      }
    },
    onFinish: () => {
      console.log("finihsh");
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
    },
    onMove: () => {
      console.log("move");
    },
    threshold: 222, // In milliseconds
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
    <>
      <VStack
        align="start"
        py={2}
        userSelect="none"
        {...restItemProps}
        spacing={0}
        filter={mode === "slow" ? `blur(${progress / 60}px)` : "none"}
      >
        <HStack w="full" align="start" justify="space-between">
          <Title task={task} onOpen={onOpen} />
          {mode === "slow" ? (
            <Button
              {...bind()}
              variant="unstyled"
              size="xs"
              borderRadius="50%"
              background={`linear-gradient(to right, #374ed7, ${
                progress / 0.8
              }%, #54c3fa88);`}
              // borderWidth={`${5 + progress / 32}px`}
            />
          ) : (
            <FistButton
              variant="outline"
              size="sm"
              borderRadius="50%"
              borderColor="gray.800"
              onClick={onRemoveClick}
            >
              👊
            </FistButton>
          )}
        </HStack>
        <Overlay isOpen={isOpen} onClose={onClose} {...props} />
      </VStack>
    </>
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

const Title = ({ task, onOpen }: Props & OverlayProps) => (
  <Box
    w="100%"
    textAlign="left"
    as="span"
    fontSize="lg"
    fontWeight={600}
    onClick={onOpen}
  >
    {task.title.emoji} {task.title.text}
  </Box>
);
