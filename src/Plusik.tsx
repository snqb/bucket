import { Text, TextProps } from "@chakra-ui/react";

export const Plusik = (props: TextProps & { isActive?: boolean }) => {
  const { isActive = false, ...restProps } = props;
  return (
    <Text
      w="20px"
      flexShrink="0"
      textAlign="center"
      fontSize="14px"
      borderRadius="50%"
      borderColor={isActive ? "white" : "gray.500"}
      color={isActive ? "white" : "gray.500"}
      fontWeight="bold"
      {...restProps}
    >
      +
    </Text>
  );
};
