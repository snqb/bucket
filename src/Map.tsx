import {
  Box,
  BoxProps,
  Center,
  HStack,
  VStack,
  forwardRef,
} from "@chakra-ui/react";
import { useContext } from "react";
import { CoordinatesContext } from "./App";
import "./Map.css";
import { useAppSelector } from "./store";

export const Map = ({ fake = false }: { fake?: boolean }) => {
  const [activeRow, activeColumn] = useContext(CoordinatesContext);

  const { structure, isOutOnX, isOutOnY } = useGrid();

  return (
    <VStack
      color="white"
      fontSize="8px"
      minW="24px"
      minH="24px"
      gap={1}
      align="baseline"
    >
      {/* <Text>
        {activeRow}:{activeColumn}:{fake && "fake"}
      </Text> */}
      {structure.map((row, rowIndex) => {
        return (
          <HStack
            key={rowIndex}
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
                    bg: onIt ? "gray.400" : "white",
                    transform: onIt ? "scale(1.2)" : undefined,
                  }}
                  key={`${rowIndex}-${colIndex}`}
                />
              );
            })}
            {fake && rowIndex === activeRow && (
              <Fake data-onit={isOutOnX} key={`${rowIndex}-${fake}`} />
            )}
          </HStack>
        );
      })}
      {fake && isOutOnY && (
        <Fake data-onit={isOutOnX} key={`${"qew"}-${fake}`} />
      )}
    </VStack>
  );
};

const Fake = forwardRef<BoxProps, "div">((props, ref) => {
  return (
    <Center {...props} className="fake dot" fontSize="0.3rem" ref={ref}>
      ➕
    </Center>
  );
});

const useGrid = () => {
  const [y, x] = useContext(CoordinatesContext);
  const { structure, values } = useAppSelector((state) => state.todo);
  const isOutOnY = y === structure.length;
  const isOutOnX = x === structure?.[y]?.length;

  return {
    y,
    x,
    isOutOnY,
    isOutOnX,
    structure,
  };
};
