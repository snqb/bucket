import { Text, VStack } from "@chakra-ui/react";

export const Map = ({
  position,
  slides,
  fake = false,
}: {
  position: [number, number];
  slides: string[][];
  fake?: boolean;
}) => {
  const [activeRow, activeColumn] = position;
  const grid = slides.concat(true ? [["➕"]] : []);

  return (
    <VStack
      color="white"
      fontSize="8px"
      minW="24px"
      minH="24px"
      gap={0}
      align="baseline"
    >
      {slides.map((row, index) => {
        let legend = Array(row.length).fill("⏺️");
        if (activeRow === index) {
          const marker = "⭕";
          legend[activeColumn] = marker;
        }
        legend[row.length] = activeColumn === row.length ? "⚔️" : "➕";
        return <Text key={legend.concat(index).join("")}>{legend}</Text>;
      })}
      <Text key="fake-vertical">
        {activeRow === slides.length ? "⚔️" : "➕"}
      </Text>
    </VStack>
  );
};
