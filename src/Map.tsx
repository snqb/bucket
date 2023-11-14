import { Box, HStack, Text, VStack, styled } from "@chakra-ui/react";
import { useAppSelector } from "./store";
import { useContext } from "react";
import { CoordinatesContext } from "./App";
import "./Map.css";

export const Map = ({ fake = false }: { fake?: boolean }) => {
  const [activeRow, activeColumn] = useContext(CoordinatesContext);

  const { structure, values } = useAppSelector((state) => state.todo);
  const value = values[structure[activeRow][activeColumn]];
  const row = values[activeRow];
  const isOutOnX = activeColumn === structure[activeRow].length;

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
        console.log(row);
        return (
          <HStack
            key={row[rowIndex]}
            border="1px solid gray.400"
            gap={1}
            height="0.5rem"
            className="row"
          >
            {row.map((_, colIndex) => {
              return (
                <>
                  <Box
                    className="dot"
                    data-fake={value === undefined}
                    data-onit={
                      rowIndex === activeRow && colIndex === activeColumn
                        ? "true"
                        : undefined
                    }
                    key={`${rowIndex}-${colIndex}`}
                  />
                </>
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
      {/* <Text key="fake-vertical">
        {activeRow === slides.length ? "⚔️" : "➕"}
      </Text> */}
    </VStack>
  );
};

const Dot = styled(Box);
