import {
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  Table,
  Td,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { useContext } from "react";
import Adder, { getRandomEmoji } from "./Adder";
import { CoordinatesContext } from "./App";
import { Plusik } from "./Plusik";
import { removeScreen, useAppDispatch, useAppSelector } from "./store";

export const Map = () => {
  const coords = useContext(CoordinatesContext);
  const [activeRow, activeColumn] = coords;
  const dispatch = useAppDispatch();

  const { structure, isOutOnX, isOutOnY, isOnLastX, isOnLastY } = useGrid();

  return (
    <HStack align="stretch" justify="space-between">
      <VStack align="baseline" gap="0">
        <VStack
          w="min-content"
          borderColor="gray.600"
          fontSize="md"
          align="left"
          gap={0}
        >
          {structure.map((row, rowIndex, rows) => {
            const isActiveRow = rowIndex === activeRow;
            return (
              <HStack gap={0}>
                {row.map((name, colIndex, columns) => {
                  const isActiveCol = colIndex === activeColumn;
                  const isActiveCell = isActiveRow && isActiveCol;

                  const isXNeighbour =
                    isActiveRow && Math.abs(activeColumn - colIndex) <= 1;

                  const isYNeighbour =
                    isActiveCol && Math.abs(activeRow - rowIndex) <= 1;

                  return (
                    <Box
                      border="1px solid"
                      borderRadius="4px"
                      p={isActiveCell ? 2 : 1}
                      color={isActiveCell ? "white" : "gray.400"}
                      opacity={isActiveCell ? 1 : 0.5}
                    >
                      <Heading
                        fontSize={isActiveCell ? "md" : "sm"}
                        whiteSpace="nowrap"
                        color={isActiveCell ? "white" : "gray.400"}
                        textTransform="capitalize"
                      >
                        {getRandomEmoji(name)}
                        {(isXNeighbour || isYNeighbour || row.length === 1) && (
                          <Box as="span" fontSize="md" fontStyle="italic">
                            {name}
                          </Box>
                        )}
                      </Heading>
                    </Box>
                  );
                })}
                {isActiveRow && (isOnLastX || isOutOnX) && (
                  <Box>{isOnLastX ? <Plusik /> : <FakeAdder />}</Box>
                )}
              </HStack>
            );
          })}
          {(isOnLastY || isOutOnY) && (
            <span>
              {isOnLastY ? <Plusik /> : isOutOnY ? <FakeAdder /> : null}
            </span>
          )}
        </VStack>
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
    <HStack w="max-content">
      {/* <Plusik isActive /> */}
      <Adder
        size="xs"
        // variant="filled"
        placeholder="add screen"
        what="screen"
        border="1px"
        borderColor="gray.600"
      />
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
