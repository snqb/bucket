import { Box, Button, HStack, Heading, StackProps, VStack } from "@chakra-ui/react";
import { PropsWithChildren, useContext, useMemo } from "react";
import Adder, { getRandomEmoji } from "./Adder";
import { CoordinatesContext } from "./App";
import { Plusik } from "./Plusik";
import { removeScreen, useAppDispatch, useAppSelector } from "./store";

interface Props extends StackProps {
  x: number;
  y: number;
}

export const Map = ({ x: activeRow, y: activeColumn, ...props }: Props) => {
  const coords = useContext(CoordinatesContext);
  const dispatch = useAppDispatch();

  const { structure, isOutOnX, isOutOnY, isOnLastX, isOnLastY } = useGrid();

  return (
    <HStack align="stretch" justify="space-between" {...props}>
      <VStack align="baseline" gap="0">
        <VStack
          w="min-content"
          borderColor="red.400"
          fontSize="md"
          align="left"
          gap={0}
        >
          {structure.map((row, rowIndex) => {
            const isActiveRow = rowIndex === activeRow;
            return (
              <HStack gap={0} key={rowIndex}>
                {row.map((name, colIndex) => {
                  const isActiveCol =
                    colIndex === activeColumn || row.length - 1 < activeColumn;
                  const isActiveCell = isActiveRow && isActiveCol;

                  const isXNeighbour =
                    isActiveRow && Math.abs(activeColumn - colIndex) <= 1;

                  const isYNeighbour =
                    isActiveCol && Math.abs(activeRow - rowIndex) <= 1;

                  const rowDistance = Math.abs(activeRow - rowIndex);
                  const scale = 2 * (rowDistance - 1);

                  return (
                    <Box
                      transform={`rotateZ(${scale}deg)`}
                      key={`${rowIndex}-${colIndex}`}
                    >
                      <GridTitle isActive={isActiveCell}>
                        {getRandomEmoji(name)}
                        {(isXNeighbour || isYNeighbour) && (
                          <Box as="span" fontSize="md" fontStyle="italic">
                            {name}
                          </Box>
                        )}
                      </GridTitle>
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

      {/* <HStack align="baseline">
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
      </HStack> */}
    </HStack>
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
  const { structure } = useAppSelector((state) => state.todo);
  const isOutOnY = y === structure.length;
  const isOnLastY = y === structure.length - 1;
  const isOutOnX = x === structure?.[y]?.length;
  const isOnLastX = x === structure?.[y]?.length - 1;

  const values = useMemo(() => {
    return {
      y,
      x,
      isOutOnY,
      isOutOnX,
      structure,
      isOnLastX,
      isOnLastY,
    };
  }, [y, x, isOutOnY, isOutOnX, structure, isOnLastX, isOnLastY]);

  return values;
};
