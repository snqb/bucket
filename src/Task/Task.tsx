import {
  Box,
  Flex,
  IconButton,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Text,
  ModalHeader,
  ModalOverlay,
  Progress,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spacer,
  useDisclosure,
  useColorModeValue,
  ListItemProps,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { forwardRef, useRef, useState } from "react";
import useDoubleClick from "use-double-click";
import { mergeRefs } from "react-merge-refs";

interface Props extends ListItemProps {
  task: ITask;
  canMoveUp?: boolean;
  highlighted?: boolean;
}

const Task = forwardRef(
  (
    { task, canMoveUp = false, highlighted = false, ...restItemProps }: Props,
    ref: any
  ) => {
    const { rejectTask, moveToToday, moveToBucketFromToday, today, isToday } =
      useTasks();
    const bg = useColorModeValue("gray.50", "gray.900");
    const taskRef = useRef(ref);

    const {
      isOpen,
      onClose: closeSlider,
      onOpen: openSlider,
    } = useDisclosure({ defaultIsOpen: false });
    const [progress, setProgress] = useState(0);

    useDoubleClick({
      onSingleClick: openSlider,
      onDoubleClick: () => {
        if (isToday(task)) {
          moveToBucketFromToday(task);
        } else {
          moveToToday(task);
        }
      },
      ref: taskRef,
      latency: 200,
    });

    const onProgress = (progress: number) => {
      setProgress(progress);

      if (progress === 100) {
        rejectTask(task.id);
      }
    };

    return (
      <ListItem
        ref={mergeRefs([ref, taskRef])}
        p={2}
        background={bg}
        borderRadius="lg"
        userSelect="none"
        border={highlighted ? "1px solid orange" : "iniital"}
        textTransform="lowercase"
        {...restItemProps}
      >
        <Flex justify="space-between" align="center">
          <Flex>
            <Text>
              {task.title.emoji} {task.title.text}
            </Text>
          </Flex>

          <Progress
            minWidth="32px"
            value={progress}
            borderRadius="4px"
            colorScheme="orange"
          />
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
    );
  }
);

const Emoji = ({ _ }: { _: string }) => <>{_}</>;

export default Task;
