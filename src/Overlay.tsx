import {
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
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  Todo,
  moveTask,
  updateDescription,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { getRandomEmoji } from "./emojis";

type OverlayProps = {
  task: Todo;
  isOpen: boolean;
  onClose: () => void;
  where: string;
};

export const Overlay = ({ isOpen, onClose, task, where }: OverlayProps) => {
  const dispatch = useAppDispatch();
  const { structure } = useAppSelector((state) => state.todo);

  const handleMove = (screen: string) => {
    dispatch(
      moveTask({
        from: where,
        to: screen,
        id: task.id,
      })
    );

    onClose();
  };

  const handleUpdateDescription = (text: string) => {
    dispatch(
      updateDescription({
        key: where,
        id: task.id,
        text,
      })
    );
  };

  return (
    <Modal motionPreset="none" size="full" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter="blur(10px)" backdropBlur="1px" />
      <ModalContent bg="gray.900">
        <ModalHeader>
          <HStack justify="space-between">
            <Heading as="h3" size="xl">
              {task.title.text}
            </Heading>
            <Button
              colorScheme="gray"
              variant="outline"
              mr={3}
              onClick={onClose}
            >
              ✖️
            </Button>
          </HStack>
        </ModalHeader>
        <ModalBody>
          <VStack align="start" spacing={4} filter="saturate(0.2)">
            <Heading fontSize="lg">Details</Heading>
            <Textarea
              onFocus={(e) => {
                const element = e.target;
                element.setSelectionRange(
                  element.value.length,
                  element.value.length
                );
              }}
              defaultValue={task.description}
              onBlur={(e) => handleUpdateDescription(e.currentTarget.value)}
              rows={10}
              placeholder="Longer text"
            />
            <Heading fontSize="lg">Move to:</Heading>
            {structure.map((row, index) => {
              return (
                <HStack key={index} flex={1} align="start">
                  {row.map((screen, index) => {
                    return (
                      <Button
                        variant="outline"
                        tabIndex={-1}
                        key={"ss" + index}
                        bg="blackAlpha.800"
                        color="white"
                        px={1}
                        fontSize="sm"
                        isDisabled={screen === where}
                        sx={{
                          _disabled: {
                            bg: "blackAlpha.100",
                          },
                        }}
                        onClick={() => handleMove(screen)}
                      >
                        {getRandomEmoji(screen)}
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
      </ModalContent>
    </Modal>
  );
};
