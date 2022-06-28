import { Heading, List, VStack } from "@chakra-ui/react";
import { AnimatePresence } from "framer-motion";
import Adder from "../Adder";
import { useTasks } from "../data/useTasks";
import Rejected from "../Rejected";
import Task from "../Task";

const Bucket = () => {
  return (
    <VStack spacing={3} align="stretch" sx={{ minHeight: "90vh" }} py={3}>
      <Heading
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
  const { bucket } = useTasks();

  return (
    <div id="bucket">
      <List spacing={2}>
        <AnimatePresence>
          {bucket.map((task) => (
            <Task key={task.id} task={task} canMoveUp />
          ))}
        </AnimatePresence>
      </List>
    </div>
  );
};

export default Bucket;
