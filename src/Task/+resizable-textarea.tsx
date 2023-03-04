import { Box, Textarea, TextareaProps, VStack } from "@chakra-ui/react";
import { useRef } from "react";
import ResizeTextarea from "react-textarea-autosize";

interface Props extends TextareaProps {
  isExpanded: boolean;
}

export const ResizableTextarea = ({
  isExpanded,
  children,
  ...props
}: Props) => {
  const ref = useRef<any>(null);

  return (
    <VStack spacing={4}>
      {children}

      <Textarea
        {...props}
        p={1}
        ref={ref}
        minH="unset"
        overflow="hidden"
        w="100%"
        resize="none"
        minRows={1}
        as={ResizeTextarea}
      />
    </VStack>
  );
};
