import {
  Flex,
  IconButton,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  useDisclosure,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { useState } from "react";

interface Props {
  task: ITask;
  canMoveUp?: boolean;
}

const Task = ({ task, canMoveUp = false }: Props) => {
  const { rejectTask, moveToToday } = useTasks();
  const [mode, setMode] = useState("default");
  const { isOpen, onClose } = useDisclosure({ isOpen: true });
  const [progress, setProgress] = useState(0);

  const stopMarking = () => {
    onClose();
    setMode("default");
  };

  const onProgress = (progress: number) => {
    setProgress(progress);
    console.log(progress);

    if (progress === 100) {
      rejectTask(task.id);
    }
  };

  if (mode === "default") {
    return (
      <ListItem
        onClick={() => {
          setMode("do");
        }}
        p={2}
        background="gray.50"
        borderRadius="lg"
      >
        <Flex justify="space-between" align="center">
          <Flex>
            {task.title.emoji} {task.title.text}
          </Flex>
          <Flex gap={1} align="center">
            {canMoveUp && (
              <IconButton
                variant="ghost"
                aria-label="⬆️"
                icon={<Emoji _="⬆️" />}
                onClick={() => moveToToday(task)}
              >
                ⬆️
              </IconButton>
            )}
            <Progress
              filter="blur(20px)"
              flex={1}
              minWidth="32px"
              value={progress}
              borderRadius="4px"
              colorScheme="orange"
            />
          </Flex>
        </Flex>
      </ListItem>
    );
  }

  return (
    <Modal isCentered onClose={stopMarking} size="xs" isOpen={isOpen}>
      <ModalOverlay backdropFilter="blur(10px) hue-rotate(90deg)" />
      <ModalContent p={2}>
        <ModalHeader>{task.title.text}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Slider
            aria-label={`progress of ${task.title.text}`}
            defaultValue={progress}
            onChangeEnd={onProgress}
          >
            <SliderTrack bg="red.100">
              <SliderFilledTrack bg="tomato" />
            </SliderTrack>
            <SliderThumb boxSize={8}>{task.title.emoji}</SliderThumb>
          </Slider>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const Emoji = ({ _: emoji }: { _: string }) => <>{emoji}</>;

export default Task;
