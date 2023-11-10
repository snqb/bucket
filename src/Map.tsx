import { Text, VStack } from "@chakra-ui/react";
import { useAppSelector } from "./store";

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
  const structure = useAppSelector((state) => state.todo.structure);

  return (
    <VStack
      color="white"
      fontSize="8px"
      minW="24px"
      minH="24px"
      gap={0}
      align="baseline"
    >
      {structure.map((row, index) => {
        let legend = Array(row.length).fill("⏺️");
        if (activeRow === index) {
          const marker = "⭕";
          legend[activeColumn] = marker;
        }
        legend[row.length] =
          activeRow === index && (activeColumn === row.length ? "⚔️" : "➕");
        return <Text key={legend.concat(index).join("")}>{legend}</Text>;
      })}
      <Text key="fake-vertical">
        {activeRow === slides.length ? "⚔️" : "➕"}
      </Text>
    </VStack>
  );
};
