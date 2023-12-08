import {
  Box,
  Button,
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
        <Table
          w="min-content"
          borderRadius="4px"
          borderColor="gray.600"
          fontSize="md"
        >
          {structure.map((row, rowIndex) => {
            const isActiveRow = rowIndex === activeRow;
            return (
              <Tr>
                {row.map((name, colIndex) => {
                  const isActiveCol = colIndex === activeColumn;
                  const isActiveCell = isActiveRow && isActiveCol;

                  return (
                    <Td
                      border="1px solid"
                      p="2px"
                      colSpan={isActiveCell ? 3 : 1}
                      color={isActiveCell ? "white" : "gray.400"}
                    >
                      <Heading
                        fontSize="md"
                        whiteSpace="nowrap"
                        color={isActiveCell ? "white" : "gray.400"}
                        textTransform="capitalize"
                      >
                        {getRandomEmoji(name)}
                        {name?.[0]}
                        {isActiveCell && (
                          <Box as="span" fontSize="md" fontStyle="italic">
                            {name?.substring(1)}
                          </Box>
                        )}
                      </Heading>
                    </Td>
                  );
                })}
                {isActiveRow && (isOnLastX || isOutOnX) && (
                  <td colSpan={0}>{isOnLastX ? <Plusik /> : <FakeAdder />}</td>
                )}
                {/* <Tr>
                  <Td colSpan={100}> */}
                {/* {isOnLastX && isActiveRow && <Plusik />} */}
                {/* </Td>
                </Tr> */}
                {/* {isOutOnX && isActiveRow && <FakeAdder />} */}
              </Tr>
            );
          })}
          {(isOnLastY || isOutOnY) && (
            <span>
              {/* <Td p="2px" colSpan={100} border="none"> */}
              {isOnLastY ? <Plusik /> : isOutOnY ? <FakeAdder /> : null}
              {/* </Td> */}
            </span>
          )}
        </Table>
        {/* {isOutOnY && <FakeAdder />} */}
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
