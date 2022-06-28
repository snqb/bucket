import {
  Box,
  Flex,
  IconButton,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spacer,
  useDisclosure,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  task: ITask;
  canMoveUp?: boolean;
}

const Task = ({ task, canMoveUp = false }: Props) => {
  const { rejectTask, moveToToday, moveToBucketFromToday } = useTasks();

  const {
    isOpen,
    onClose: closeSlider,
    onOpen: openSlider,
  } = useDisclosure({ defaultIsOpen: false });
  const [progress, setProgress] = useState(0);

  const onProgress = (progress: number) => {
    setProgress(progress);

    if (progress === 100) {
      rejectTask(task.id);
    }
  };

  return (
    <>
      <ListItem
        as={motion.li}
        onClick={openSlider}
        p={2}
        background="gray.50"
        borderRadius="lg"
        exit={{ opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        initial={{ opacity: 0.3 }}
        whileTap={{
          opacity: 0.5,
        }}
      >
        <Flex justify="space-between" align="center">
          <Flex>
            {task.title.emoji} {task.title.text}
          </Flex>
          {canMoveUp ? (
            <Box px={1}>
              <Box
                as={motion.span}
                drag="y"
                dragSnapToOrigin
                dragConstraints={{ top: 4, bottom: 4 }}
                whileDrag={{
                  scaleY: 1.2,
                  scaleX: 0.8,
                }}
                whileTap={{ scale: 1.2 }}
                // @ts-ignore
                onDragEnd={(_: any, info: any) => {
                  console.log(info);
                  if (info.delta.y < 0) {
                    moveToToday(task);
                  } else if (info.delta.y > 0) {
                    rejectTask(task.id);
                  }
                }}
                padding="2"
                bgGradient="radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(108,188,233,1) 25%, rgba(255,255,255,1) 35%, rgba(17,1,162,1) 45%);"
                borderRadius="full"
                width="5"
                height="5"
                display="flex"
              />
            </Box>
          ) : (
            <Progress
              minWidth="32px"
              value={progress}
              borderRadius="4px"
              colorScheme="orange"
            />
          )}
        </Flex>
        <Modal isCentered onClose={closeSlider} size="xs" isOpen={isOpen}>
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
            {!canMoveUp && (
              <Flex py={1} justify="space-between">
                <Spacer />
                <IconButton
                  onClick={() => moveToBucketFromToday(task)}
                  size="xs"
                  variant="outline"
                  p={3}
                  icon={<Emoji _="🪣🪣🪣" />}
                  aria-label="⬇️ 🪣 ⬇️"
                />
              </Flex>
            )}
          </ModalContent>
        </Modal>
      </ListItem>
    </>
  );
};

const Emoji = ({ _ }: { _: string }) => <>{_}</>;

export default Task;
