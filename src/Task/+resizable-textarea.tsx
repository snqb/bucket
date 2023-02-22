import { Textarea, TextareaProps } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import ResizeTextarea from "react-textarea-autosize";
import scrollIntoView from "scroll-into-view-if-needed";

interface Props extends TextareaProps {
  isExpanded: boolean;
}

export const ResizableTextarea = ({ isExpanded, ...props }: Props) => {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (isExpanded && ref.current) {
      scrollIntoView(ref.current, {
        inline: "end",
      });
    }
  }, [isExpanded, ref?.current]);

  return (
    <Textarea
      {...props}
      p={0}
      ref={ref}
      minH="unset"
      overflow="hidden"
      w="100%"
      resize="none"
      minRows={1}
      as={ResizeTextarea}
    />
  );
};
