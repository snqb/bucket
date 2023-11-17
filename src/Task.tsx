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
  useAppDispatch,
  useAppSelector,
} from "./store";

interface Props extends AccordionItemProps {
  task: Todo;
  where: keyof TodoState;
}

export const ShortTask = (props: Props) => {
  const { task, where, ...restItemProps } = props;
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onRemoveClick = () => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      }),
    );
  };

  return (
    <>
      <VStack
        align="start"
        py={2}
        userSelect="none"
        {...restItemProps}
        spacing={0}
      >
        <HStack w="full" align="baseline" justify="space-between">
          <Title task={task} onOpen={onOpen} />
          <Button
            variant="ghost"
            size="xs"
            fontSize="md"
            fontWeight="bold"
            onClick={onRemoveClick}
            filter="saturate(0)"
          >
            ❌
          </Button>
        </HStack>
        <Overlay isOpen={isOpen} onClose={onClose} {...props} />
      </VStack>
    </>
  );
};

type OverlayProps = any;

const Overlay = ({ isOpen, onClose, task, where }: Props & OverlayProps) => {
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
            {structure.map((row) => {
              return (
                <HStack flex={1} align="start">
                  {row.map((screen) => (
                    <Button
                      variant="outline"
                      tabIndex={-1}
                      key={screen}
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
                  ))}
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
