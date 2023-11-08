import { Text, VStack } from "@chakra-ui/react";

export const Map = ({
  position,
  slides,
}: {
  position: [number, number];
  slides: string[][];
}) => {
  const [activeRow, activeColumn] = position;
  return (
    <VStack
      color="white"
      fontSize="10px"
      minW="24px"
      minH="24px"
      gap={0}
      align="baseline"
    >
      {slides.map((row, index) => {
        let legend = Array(row.length).fill("🍩");
        if (activeRow === index) {
          legend[activeColumn] = "⏺️";
        }
        return <Text key={legend.concat(index).join("")}>{legend}</Text>;
      })}
    </VStack>
  );
};
