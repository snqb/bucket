import {
  Button,
  Divider,
  Flex,
  ListItem,
  ListItemProps,
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
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { ITask, useTasks } from "../data/useTasks";

import { forwardRef, useRef, useState } from "react";
import { mergeRefs } from "react-merge-refs";
import useDoubleClick from "use-double-click";

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
    const {
      killIt,
      moveToToday,
      moveToBucketFromToday,
      isToday,
      saveProgress,
      describe,
    } = useTasks();
    // these two below are for dark mode
    const bgEmptyBar = useColorModeValue(
      "var(--chakra-colors-gray-50)",
      "var(--chakra-colors-gray-900)"
    );
    const bgFullBar = useColorModeValue("#5ABCEE", "#2C65AE");
    const [description, setDescription] = useState(task.description ?? "");

    const taskRef = useRef(ref);

    const {
      isOpen,
      onClose: closeSlider,
      onOpen: openSlider,
    } = useDisclosure({
      defaultIsOpen: false,
      onClose: () => {
        saveProgress(task, progress);
        describe(task, description);
      },
    });
    const [progress, setProgress] = useState(task.progress ?? 0);

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
        killIt(task);
      }
    };

    return (
      <ListItem
        ref={mergeRefs([ref, taskRef])}
        p={2}
        borderRadius="lg"
        userSelect="none"
        border={highlighted ? "1px solid orange" : "iniital"}
        textTransform="lowercase"
        {...restItemProps}
      >
        <Text>
          {task.title.emoji} {task.title.text}
        </Text>
        <Progress
          height="1px"
          mt={2}
          colorScheme="blue"
          size="xs"
          value={progress}
        />

        <Modal isCentered onClose={closeSlider} size="xs" isOpen={isOpen}>
          <ModalOverlay backdropFilter="blur(10px) hue-rotate(90deg)" />
          <ModalContent p={2}>
            <ModalHeader>{task.title.text}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex direction="column" align="flex-start" gap={4}>
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
                <Button
                  size="xs"
                  variant="outline"
                  borderStyle="dotted"
                  colorScheme="pink"
                  onClick={() => killIt(task)}
                >
                  🔪 {"   "} f* it
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </ListItem>
    );
  }
);

export default Task;
