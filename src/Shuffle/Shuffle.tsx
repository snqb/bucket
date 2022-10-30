import { Accordion, Box, Button, VStack } from "@chakra-ui/react";
import { useTasks } from "../data/useTasks";
import Task from "../Task";
import * as R from "ramda";

import { useState } from "react";

const Shuffle = () => {
  const { shuffle, bucket } = useTasks();
  const howMuchToShuffleBesidesPinned = 3 - shuffle.length;

  const fillTheGaps = () =>
    sampleSize(howMuchToShuffleBesidesPinned, R.difference(bucket, shuffle));

  const [newlyShuffled, setShuffled] = useState(fillTheGaps());

  return (
    <Box position="relative">
      <VStack align="stretch" py={2}>
        <Accordion allowToggle>
          {[...shuffle, ...newlyShuffled].map((task, index) => (
            <Task hasPin tabIndex={index} mb={4} key={task.id} task={task} />
          ))}
        </Accordion>
        <Button
          onClick={() => setShuffled(fillTheGaps())}
          background={gradient}
          size="lg"
          fontSize="4xl"
          rounded="sm"
          py={8}
        >
          🎲
        </Button>
      </VStack>
    </Box>
  );
};

export default Shuffle;

function sampleSize<T>(size: number, list: T[], collected: T[] = []): T[] {
  return size < 1 || list.length < 1
    ? collected
    : size >= list.length
    ? [...collected, ...list] // or throw error?
    : Math.random() < size / list.length
    ? sampleSize(size - 1, list.slice(1), [...collected, list[0]])
    : sampleSize(size, list.slice(1), collected);
}

const gradient = `linear-gradient(to right, 
  #00C6FB, 
  #3DBBFF, 
  #6CADFF, 
  #979DFC, 
  #BA8BEA,
  #C783DE,
  #D778CF,
  #E965AD,
  #F15787,
  #ED525F,
  #DF5737)`;
