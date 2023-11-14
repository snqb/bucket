import { Box, HStack, Text, VStack, Grid, GridItem } from "@chakra-ui/react";
import { useAppSelector } from "./store";
import { useContext } from "react";
import { CoordinatesContext } from "./App";
import "./Map.css";

const useGrid = () => {
  const [y, x] = useContext(CoordinatesContext);
  const { structure, values } = useAppSelector((state) => state.todo);
  const isOutOnY = y === structure.length;
  const isOutOnX = x === structure?.[y]?.length;

  // Function to get the value at the current coordinates
  const getCurrentValue = () => {
    if (!isOutOnY && !isOutOnX) {
      return values[structure[y][x]];
    }
    return null;
  };

  // Navigation functions (to be implemented)
  const moveToNext = () => {
    /* ... */
  };
  const moveToPrevious = () => {
    /* ... */
  };
  const moveUp = () => {
    /* ... */
  };
  const moveDown = () => {
    /* ... */
  };

  return {
    y,
    x,
    isOutOnY,
    isOutOnX,
    getCurrentValue,
    moveToNext,
    moveToPrevious,
    moveUp,
    moveDown,
  };
};

export const Map = ({
  fake = false,
  cellColor,
  currentColor,
}: {
  fake?: boolean;
  cellColor: string;
  currentColor: string;
}) => {
  const [activeRow, activeColumn] = useContext(CoordinatesContext);

  const { structure, values } = useAppSelector((state) => state.todo);
  const value = values[structure?.[activeRow]?.[activeColumn]];
  const isOutOnY = activeRow === structure.length;
  const isOutOnX = activeColumn === structure?.[activeRow]?.length;

  const css = `
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${cellColor}; /* default background */
  transition: background 1s;

  
  `;

  return (
    <VStack
      color="white"
      fontSize="8px"
      minW="24px"
      minH="24px"
      gap={1}
      align="baseline"
    >
      <Text>
        {activeRow}:{activeColumn}:{fake && "fake"}
      </Text>
      {structure.map((row, rowIndex) => {
        return (
          <HStack
            key={row[rowIndex]}
            border="1px solid gray.400"
            gap={1}
            height="0.5rem"
            className="row"
          >
            {row.map((_, colIndex) => {
              const onIt = rowIndex === activeRow && colIndex === activeColumn;
              return (
                <Box
                  className="dot"
                  sx={{
                    bg: onIt ? currentColor : cellColor,
                    transform: onIt ? "scale(1.2)" : undefined,
                  }}
                  key={`${rowIndex}-${colIndex}`}
                />
              );
            })}
            {fake && rowIndex === activeRow && (
              <Box
                className="fake dot"
                data-onit={isOutOnX}
                key={`${rowIndex}-${fake}`}
              ></Box>
            )}
          </HStack>
        );
      })}
      {fake && isOutOnY && (
        <Box
          className="fake dot"
          data-onit={isOutOnX}
          key={`${"qew"}-${fake}`}
        ></Box>
      )}
    </VStack>
  );
};
