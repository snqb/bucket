import { Box, Button, Center, HStack, Heading, VStack } from "@chakra-ui/react";
import { useContext } from "react";
import Adder, { getRandomEmoji } from "./Adder";
import { CoordinatesContext } from "./App";
import { removeScreen, useAppDispatch, useAppSelector } from "./store";

export const Map = () => {
  const coords = useContext(CoordinatesContext);
  const [activeRow, activeColumn] = coords;
  const dispatch = useAppDispatch();

  const { structure, isOutOnX, isOutOnY } = useGrid();

  return (
    <HStack align="stretch" justify="space-between">
      <VStack
        color="white"
        fontSize="8px"
        minW="24px"
        minH="24px"
        gap={1}
        align="baseline"
      >
        {structure.map((row, rowIndex) => {
          const isActiveRow = rowIndex === activeRow;
          return (
            <HStack
              key={rowIndex}
              borderY={isActiveRow ? "1px solid" : "none"}
              borderColor="pink.900"
              gap={2}
              py={1}
            >
              {row.map((name, colIndex) => {
                const isActiveCol = colIndex === activeColumn;
                const isActiveCell = isActiveRow && isActiveCol;

                return (
                  <HStack>
                    <Center
                      sx={{
                        fontSize: "7px",
                        borderRadius: "50%",
                        transition: "background .7s",
                        bg: isActiveCell ? "pink.600" : "transparent",
                        transform: isActiveCell ? "scale(1.5)" : undefined,
                        filter: isActiveCell ? "none" : "saturate(0.5)",
                      }}
                    >
                      {getRandomEmoji(name)}
                    </Center>
                    {isActiveCell && (
                      <Heading
                        fontSize="lg"
                        fontWeight="bold"
                        // fontStyle="italic"
                      >
                        {name}
                      </Heading>
                    )}
                  </HStack>
                );
              })}
              {isOutOnX && isActiveRow && <FakeAdder />}
            </HStack>
          );
        })}
        {isOutOnY && <FakeAdder />}
      </VStack>
      <HStack align="baseline">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            dispatch(removeScreen({ coords }));
          }}
        >
          🗑️
        </Button>
      </HStack>
    </HStack>
  );
};

const FakeAdder = () => {
  return (
    <HStack>
      <Box>+</Box>
      <Adder size="sm" variant="ghost" placeholder="add screen" what="screen" />
    </HStack>
  );
};

const useGrid = () => {
  const [y, x] = useContext(CoordinatesContext);
  const { structure, values } = useAppSelector((state) => state.todo);
  const isOutOnY = y === structure.length;
  const isOnLastY = y === structure.length - 1;
  const isOutOnX = x === structure?.[y]?.length;
  const isOnLastX = x === structure?.[y]?.length - 1;

  return {
    y,
    x,
    isOutOnY,
    isOutOnX,
    structure,
    isOnLastX,
    isOnLastY,
  };
};
