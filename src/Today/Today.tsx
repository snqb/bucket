import {
  Center,
  Divider,
  Flex,
  Heading,
  List,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTasks } from "../data/useTasks";
import Task from "../Task";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Adder from "../Adder";
import { AnimatePresence } from "framer-motion";

const Today = () => {
  return (
    <VStack spacing={3} align="stretch" sx={{ minHeight: "80vh" }} py={3}>
      <Heading userSelect="none" as="h1">
        Today
      </Heading>
      <Adder today />

      <TodayView />
    </VStack>
  );
};

const TodayView = () => {
  const { today } = useTasks();

  if (today.length === 0) {
    return <Empty />;
  }

  return (
    <Flex h="100%" direction="column" justify="space-between">
      <List spacing={2}>
        <AnimatePresence>
          {today.map((task) => (
            <Task key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </List>
    </Flex>
  );
};

export default Today;

const Empty = () => {
  return (
    <Center userSelect="none">
      <Flex direction="column" textAlign="center">
        <Text fontSize="6xl">YO</Text>
        <Text fontSize="6xl">BRO</Text>
        <Text fontSize="6xl">🪣</Text>
        <Text fontSize="6xl">👇</Text>
        <Text fontSize="6xl">🪣</Text>
        <Text fontSize="6xl">👇</Text>
      </Flex>
    </Center>
  );
};
