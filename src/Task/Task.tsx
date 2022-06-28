import {
  Box,
  Flex,
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

import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  task: ITask;
  canMoveUp?: boolean;
}

const Task = ({ task, canMoveUp = false }: Props) => {
  const { rejectTask, moveToToday } = useTasks();
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
      >
        <Flex justify="space-between" align="center">
          <Flex>
            {task.title.emoji} {task.title.text}
          </Flex>
          {canMoveUp ? (
            <Box px={1}>
              <Box
                as={motion.div}
                whileDrag={{
                  opacity: [0.9, 0.7],
                  scaleY: [1.2, 1],
                  scaleX: [0.8, 1],
                }}
                drag="y"
                dragConstraints={{ top: 10, bottom: 10 }}
                whileTap={{ scale: 1.5 }}
                dragElastic={0.8}
                // @ts-ignore
                onDragEnd={(_: any, info: any) => {
                  console.log(info);
                  if (info.delta.y < 0) {
                    moveToToday(task);
                  }
                }}
                padding="2"
                bgGradient="radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(108,188,233,1) 25%, rgba(255,255,255,1) 35%, rgba(17,1,162,1) 45%);"
                borderRadius="full"
                width="4"
                height="4"
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
          </ModalContent>
        </Modal>
      </ListItem>
    </>
  );
};

export default Task;
