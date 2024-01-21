import {
  Box,
  Button,
  HStack,
  Heading,
  StackProps,
  VStack,
} from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { getRandomEmoji } from "./emojis";
import { position$ } from "./App";
import { removeScreen, useAppDispatch, useAppSelector } from "./store";

interface Props extends StackProps {}

export const Map = (props: Props) => {
  const [currentRow, currentColumn] = position$.get();
  const dispatch = useAppDispatch();
  const { structure } = useAppSelector((state) => state.todo);

  return (
    <HStack
      userSelect="none"
      align="stretch"
      justify="space-between"
      {...props}
    >
      <VStack align="baseline" gap="0">
        <VStack
          w="min-content"
          borderColor="red.400"
          fontSize="md"
          align="left"
          gap={0}
        >
          {structure.map((row, rowIndex) => {
            const isActiveRow = rowIndex === currentRow;
            return (
              <HStack gap={0} key={rowIndex}>
                {row.map((name, colIndex) => {
                  const isActiveCol =
                    colIndex === currentColumn ||
                    row.length - 1 < currentColumn;
                  const isActiveCell = isActiveRow && isActiveCol;

                  const isXNeighbour =
                    isActiveRow && Math.abs(currentColumn - colIndex) <= 1;

                  const isYNeighbour =
                    isActiveCol && Math.abs(currentRow - rowIndex) <= 1;

                  const rowDistance = Math.abs(currentRow - rowIndex);
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
                            {name.slice(0, 3)}
                          </Box>
                        )}
                      </GridTitle>
                    </Box>
                  );
                })}
              </HStack>
            );
          })}
        </VStack>
      </VStack>

      <HStack align="baseline">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(removeScreen({ coords: [currentRow, currentColumn] }));
          }}
        >
          🗑️
        </Button>
      </HStack>
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
