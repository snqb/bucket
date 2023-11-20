import {
  Box,
  BoxProps,
  HStack,
  VStack,
  forwardRef,
  keyframes,
} from "@chakra-ui/react";
import { useContext } from "react";
import { CoordinatesContext } from "./App";
import { useAppSelector } from "./store";

export const Map = ({ fake = false }: { fake?: boolean }) => {
  const [activeRow, activeColumn] = useContext(CoordinatesContext);

  const { structure, isOutOnX, isOutOnY, isOnLastX, isOnLastY } = useGrid();

  return (
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
            border="1px solid gray.400"
            gap={1}
            height="0.5rem"
            py="5px"
          >
            {row.map((_, colIndex) => {
              const isActiveCol = colIndex === activeColumn;
              const isActiveCell = isActiveRow && isActiveCol;
              return (
                <Box
                  sx={{
                    w: "0.24rem",
                    h: "0.24rem",
                    borderRadius: "50%",
                    transition: "background .7s",
                    bg: isActiveCell ? "gray.400" : "white",
                    transform: isActiveCell ? "scale(2)" : undefined,
                  }}
                  key={`${rowIndex}-${colIndex}`}
                />
              );
            })}
            {(isOutOnX || isOnLastX) && isActiveRow && (
              <Fake blink={isOnLastX} />
            )}
          </HStack>
        );
      })}
      {(isOutOnY || isOnLastY) && <Fake blink={isOnLastY} />}
    </VStack>
  );
};

const blinking = keyframes`
  0%, 100% {
    background: transparent;
  }
  30% {
    background: gray;
  }
`;

const Fake = forwardRef<BoxProps & { blink: boolean }, "div">(
  ({ blink = false, ...boxProps }, ref) => {
    return (
      <Box
        {...boxProps}
        ref={ref}
        sx={{
          w: "0.24rem",
          h: "0.24rem",
          borderRadius: "50%",
          transition: "background .7s",
          fontSize: "8px",
          bg: "pink.600",
          animation: blink ? `${blinking} 10s infinite` : undefined,
        }}
      ></Box>
    );
  },
);

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
