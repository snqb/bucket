import { Box, HStack, Heading, StackProps, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { PropsWithChildren } from "react";
import { $currentScreen } from "./App";
import { getRandomEmoji } from "./emojis";
import { useAppSelector } from "./store";

interface Props extends StackProps {}

const MVStack = motion(VStack);

export const Map = (props: Props) => {
  const { structure } = useAppSelector((state) => state.todo);

  return (
    <MVStack
      animate={{
        transform: "rotate(3.14deg)",
      }}
      exit={{
        transform: "rotate(0deg)",
      }}
      transition={{ repeat: Infinity, duration: 6.66, repeatType: "reverse" }}
      w="min-content"
      borderColor="red.400"
      fontSize="md"
      align="left"
      gap={0}
    >
      {structure.map((row, rowIndex) => {
        return (
          <HStack gap={0} key={rowIndex}>
            {row.map((name, colIndex) => {
              const isActiveCell = $currentScreen.get() === name;

              return (
                <Box key={`${rowIndex}-${colIndex}`}>
                  <GridTitle isActive={isActiveCell}>
                    {getRandomEmoji(name)}
                  </GridTitle>
                </Box>
              );
            })}
          </HStack>
        );
      })}
    </MVStack>
  );
};

const GridTitle = ({
  isActive,
  children,
}: PropsWithChildren<{ isActive: boolean }>) => {
  if (isActive) {
    return (
      <Box
        px={2}
        border="1px solid"
        borderColor="gray.400"
        borderRadius="4px"
        shadow="inner"
      >
        <Heading
          fontSize="md"
          whiteSpace="nowrap"
          color="white"
          textTransform="capitalize"
        >
          {children}
        </Heading>
      </Box>
    );
  }
  return (
    <Box
      border="1px solid"
      borderColor="gray.500"
      borderRadius="4px"
      px={1}
      color="gray.400"
      opacity={0.5}
    >
      <Heading fontSize="sm" whiteSpace="nowrap" textTransform="capitalize">
        {children}
      </Heading>
    </Box>
  );
};
