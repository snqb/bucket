import {
  AccordionItemProps,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UseDisclosureProps,
  UseModalProps,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";

import * as R from "ramda";

import {
  Todo,
  TodoState,
  moveTask,
  removeTask,
  useAppDispatch,
} from "./newStore";
import { PERIODS, PERIOD_TEXTS, Period } from "./constants";

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

  const handleMove = (period: Period) => {
    dispatch(
      moveTask({
        from: where,
        to: period,
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
          <Title task={task} />
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Grid templateColumns="repeat(3, 1fr)" gap={2}>
            {PERIODS.map((period) => (
              <Button
                minW="25vmin"
                minH="25vmin"
                aspectRatio="1/1"
                bg="blackAlpha.800"
                fontSize="sm"
                isDisabled={period === where}
                onClick={() => handleMove(period)}
              >
                {period === where ? "" : PERIOD_TEXTS[period]}
              </Button>
            ))}
          </Grid>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            X
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
    fontWeight={500}
    onClick={onOpen}
  >
    {task.title.emoji} {task.title.text}
  </Box>
);
