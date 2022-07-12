import { Heading, List, VStack } from "@chakra-ui/react";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Rejected from "../Rejected";
import Task from "../Task";
import FlipMove from "react-flip-move";

const Bucket = () => {
  return (
    <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
      <Heading
        userSelect="none"
        as="h1"
        onClick={() => {
          document.getElementById("bucket")?.scrollIntoView({
            behavior: "smooth",
          });
        }}
      >
        🪣Bucket
      </Heading>
      <BucketView />
      <Adder />
      <Rejected />
    </VStack>
  );
};

const BucketView = () => {
  const { bucket, today } = useTasks();

  return (
    <div id="bucket">
      <List spacing={2}>
        <FlipMove>
          {today.map((task) => (
            <Task highlighted key={`today-${task.id}`} task={task} />
          ))}
          {bucket.map((task) => (
            <Task key={task.id} task={task} />
          ))}
        </FlipMove>
      </List>
    </div>
  );
};

export default Bucket;
