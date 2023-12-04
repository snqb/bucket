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

import {
  Todo,
  TodoState,
  moveTask,
  removeTask,
  updateProgress,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { useLongPress } from "use-long-press";
import { useCallback, useEffect, useRef, useState } from "react";
interface Props extends AccordionItemProps {
  task: Todo;
  where: keyof TodoState;
}

export const ShortTask = (props: Props) => {
  const { task, where, ...restItemProps } = props;
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const hueref = useRef<number>();
  const [progress, setProgress] = useState(task.progress);

  const addSome = useCallback(() => {
    setProgress((progress) => progress + 3);

    hueref.current = requestAnimationFrame(addSome);
  }, [task.progress, where, task.id]);

  const bind = useLongPress(() => {}, {
    onStart: () => {
      hueref.current = requestAnimationFrame(addSome);
      // hueref.current = setInterval(addSome, 10);
    },
    onFinish: () => {
      console.log("finish");
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
    captureEvent: true,
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
    if (progress > 300) {
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
        filter={`blur(${progress / 100}px)`}
      >
        <HStack w="full" align="start" justify="space-between">
          <Title task={task} onOpen={onOpen} />
          <Button
            {...bind()}
            variant="ghost"
            size="xs"
            borderRadius="50%"
            borderColor="gray.600"
            borderWidth={`${1 + progress / 24}px`}
          ></Button>
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
                <HStack key={row[index]} flex={1} align="start">
                  {row.map((screen) => {
                    return (
                      <Button
                        variant="outline"
                        tabIndex={-1}
                        key={"ss" + row[index]}
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
    fontSize="xl"
    fontWeight={600}
    onClick={onOpen}
  >
    {task.title.emoji} {task.title.text}
  </Box>
);
