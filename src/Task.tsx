import {
  AccordionItemProps,
  Box,
  Button,
  HStack,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { animate, motion } from "framer-motion";
import {
  ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { level$ } from "./App";
import Glowing from "./Glowing";
import { Overlay } from "./Overlay";
import {
  Todo,
  TodoState,
  removeTask,
  updateProgress,
  useAppDispatch,
} from "./store";

const MVStack = motion(VStack);
type H = ComponentProps<typeof MVStack>;

type Props = AccordionItemProps &
  H & {
    task: Todo;
    where: keyof TodoState;
  };

export const Task = (props: Props) => {
  const { task, where, ...restItemProps } = props;
  const dispatch = useAppDispatch();
  const { isOpen, onOpen: openMoverScreen, onClose } = useDisclosure();
  const hueref = useRef<number>();

  const [progress, setProgress] = useState(task.progress);

  const deleteTask = useCallback(() => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      })
    );
  }, [dispatch, updateProgress, hueref.current, progress]);

  useEffect(() => {
    if (progress > 100) {
      deleteTask();
    }
  }, [progress]);

  const isZoomedOut = level$.get() === 1;

  return (
    <MVStack
      align="start"
      py={2}
      userSelect="none"
      {...restItemProps}
      spacing={0}
      boxSizing="border-box"
    >
      <HStack w="full" align="center" justify="space-between">
        <HStack
          as={motion.div}
          w="100%"
          align="baseline"
          onClick={isZoomedOut ? undefined : openMoverScreen}
        >
          <Text
            display="inline"
            fontSize="lg"
            opacity={1 - progress / 200}
            fontWeight={500}
          >
            {task.title.emoji}
            {task.title.text}
          </Text>
          <Text
            as={motion.div}
            display="inline"
            color="gray.500"
            fontSize="sm"
            filter="saturate(0)"
          >
            {progress}
          </Text>
        </HStack>
        {!isZoomedOut && (
          <>
            <RemoveButton
              onClick={() => {
                animate(progress, 100, {
                  duration: 1,
                  onComplete: deleteTask,
                  onUpdate: (it) => setProgress(Math.round(it)),
                });
              }}
            />
            <Glowing>
              <Box
                as={motion.div}
                borderColor="gray.900"
                _focus={{
                  bg: "initial",
                }}
                minW="4.5ch"
                borderWidth="1px"
                letterSpacing="-0.5rem"
                pl={1}
                onClick={() => {
                  const next = progress + 1;
                  dispatch(
                    updateProgress({
                      key: where,
                      id: task.id,
                      progress: next,
                    })
                  );
                  setProgress(next);
                }}
              >
                ✨✨
              </Box>
            </Glowing>
          </>
        )}
        )
      </HStack>
      <Overlay isOpen={isOpen} onClose={onClose} {...props} />
    </MVStack>
  );
};

const RemoveButton = ({ onClick }: { onClick: () => void }) => {
  const [pressedCount, setPressedCount] = useState(0);

  if (pressedCount > 1) return null;

  const handleClick = () => {
    if (pressedCount === 1) {
      onClick();
    }
    setPressedCount(1);
  };

  return (
    <Button
      transform={`scale(${pressedCount === 1 ? 1.2 : 1})`}
      size="xs"
      variant="unstyled"
      filter={`saturate(${pressedCount})`}
      borderColor="gray.900"
      onClick={handleClick}
      p={1}
    >
      ❌
    </Button>
  );
};
