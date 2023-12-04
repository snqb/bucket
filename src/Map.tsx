import {
  Box,
  BoxProps,
  Button,
  Center,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  VStack,
  forwardRef,
  keyframes,
  useDisclosure,
} from "@chakra-ui/react";
import { useContext } from "react";
import { CoordinatesContext } from "./App";
import { useAppSelector } from "./store";

export const Map = () => {
  const [activeRow, activeColumn] = useContext(CoordinatesContext);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
            onClick={onOpen}
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
                    bg: isActiveCell ? "pink.600" : "white",
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
      <BigMap isOpen={isOpen} onClose={onClose} />
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
          w: "0.48rem",
          h: "0.48rem",
          borderRadius: "50%",
          transition: "background .7s",
          fontSize: "8px",
          bg: "gray.400",
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

const BigMap = ({ isOpen, onClose }: ModalProps) => {
  const { structure, values } = useAppSelector((state) => state.todo);

  return (
    <Modal
      isCentered
      motionPreset="none"
      size="lg"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay backdropFilter="blur(10px)" backdropBlur="1px" />
      <ModalContent bg="gray.900">
        <ModalHeader>
          <Heading as="h3" size="lg">
            Map
          </Heading>
        </ModalHeader>
        <ModalBody>
          <VStack h="100%" justify="end" align="stretch">
            {structure.map((row, index) => {
              return (
                <HStack
                  key={row[index]}
                  flex={1}
                  align="start"
                  justify="stretch"
                >
                  {row.map((screen) => (
                    <Button
                      variant="outline"
                      tabIndex={-1}
                      key={screen}
                      bg="blackAlpha.800"
                      color="white"
                      fontSize="sm"
                      sx={{
                        _disabled: {
                          bg: "blackAlpha.100",
                        },
                      }}
                    >
                      {screen}
                    </Button>
                  ))}
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" variant="outline" mr={3} onClick={onClose}>
            ✖️
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
