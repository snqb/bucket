import {
  AccordionItemProps,
  Button,
  HStack,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLongPress } from "use-long-press";
import { level$ } from "./App";
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

  const killTask = useCallback(() => {
    dispatch(
      removeTask({
        key: where,
        id: task.id,
      })
    );
  }, [dispatch, updateProgress, hueref.current, progress]);

  const bind = useLongPress(() => {}, {
    onCancel: console.log,
    // onFinish: killTask,
    threshold: 500, // In milliseconds
  });

  useEffect(() => {
    if (progress > 100) {
      killTask();
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
            display="inline"
            color="gray.500"
            fontSize="sm"
            filter="saturate(0)"
          >
            {progress}✨
          </Text>
        </HStack>
        {!isZoomedOut && (
          <>
            <Button
              as={motion.button}
              whileTap={{
                transition: { duration: 0.5, type: "spring" },
                scale: 3,
                transitionEnd: { scale: 0.9 },
              }}
              whileHover={{
                scale: 3,
              }}
              size="sm"
              variant="unstyled"
              filter={`saturate(0)`}
              borderColor="gray.900"
              onClick={killTask}
              p={1}
              {...bind()}
            >
              ❌
            </Button>
            <Button
              as={motion.button}
              whileTap={{
                transition: { duration: 0.5, type: "spring" },
                scale: 3,
                transitionEnd: { scale: 0.9 },
              }}
              whileHover={{
                scale: 3,
              }}
              variant="unstyled"
              filter={`hue-rotate(${-progress * 1}deg)`}
              borderColor="gray.900"
              _focus={{
                bg: "initial",
              }}
              borderWidth="2px"
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
              p={1}
              {...bind()}
            >
              ✨
            </Button>
          </>
        )}
        )
      </HStack>
      <Overlay isOpen={isOpen} onClose={onClose} {...props} />
    </MVStack>
  );
};
