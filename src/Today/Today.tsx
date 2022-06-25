import { Center, Divider, Flex, List, Text } from "@chakra-ui/react";
import { useTasks } from "../data/useTasks";
import Task from "../Task";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const Today = () => {
  const { today } = useTasks();

  if (today.length === 0) {
    return <Empty />;
  }

  return (
    <Flex h="100%" direction="column" justify="space-between">
      <List spacing={2}>
        <TransitionGroup>
          <List spacing={2}>
            {today.map((task) => (
              <CSSTransition key={task.id} timeout={1000}>
                <Task task={task} />
              </CSSTransition>
            ))}
          </List>
        </TransitionGroup>
      </List>
      <Center>
        <Text fontSize="1xl">↓</Text>
      </Center>
    </Flex>
  );
};

export default Today;

const Empty = () => {
  return (
    <Center>
      <Flex direction="column" textAlign="center">
        <Text fontSize="6xl">YO</Text>
        <Text fontSize="6xl">BRO</Text>
        <Text fontSize="6xl">🪣</Text>
        <Text fontSize="6xl">👇</Text>
        <Text fontSize="6xl">🪣</Text>
        <Text fontSize="6xl">👇</Text>
        <Text fontSize="6xl">🪣</Text>
        <Text fontSize="6xl">👇</Text>
      </Flex>
    </Center>
  );
};
