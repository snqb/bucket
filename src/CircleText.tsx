import { Box, Button, HStack, VStack, Text } from "@chakra-ui/react";
import { PropsWithChildren, useState } from "react";
import { getRandomEmoji } from "./Adder";
import { AutoTextSize } from "auto-text-size";
import EmojiSpawner from "./Confetti";
import { CircleTextProps, huemoe } from "./Period";

export const CircleText: React.FC<CircleTextProps> = ({ text }) => {
  const [emoji] = useState(getRandomEmoji());
  const [number, setNumber] = useState(0);

  return (
    <EmojiSpawner>
      <Button
        variant="solid"
        w="fit-content"
        bg="blackAlpha.900"
        onClick={() => setNumber((it) => it + 1)}
        filter="saturate(.8)"
        _active={huemoe}
        _hover={huemoe}
        userSelect="none"
        display="flex"
        alignItems="flex-end"
        px={2}
        gap={1}
      >
        <HStack>
          <Box fontSize="2.5rem">{emoji}</Box>
          <VStack wrap="wrap">
            <Box maxW="10vw">
              <AutoTextSize
                style={{ textAlign: "left" }}
                mode="box"
                minFontSizePx={12}
                maxFontSizePx={18}
              >
                {text}
                <Medal score={number} />
              </AutoTextSize>
            </Box>
          </VStack>
        </HStack>
      </Button>
    </EmojiSpawner>
  );
};

const Medal = ({ score }: { score: number }) => {
  return (
    <Box
      borderRadius="full" // Circular shape
      width="14px"
      height="14px"
      background="linear-gradient(to bottom, #FFD700, #FFCC00, #FFD700)" // Gold gradient
      textAlign="center"
      boxShadow="0px 1px 6px #888888" // Add some shadow
      ml={1}
      position="absolute"
      bottom="3vmin"
      left="3vmin"
    >
      <Text fontSize="inherit" fontWeight="bold" color="#222">
        {score}
      </Text>
    </Box>
  );
};
