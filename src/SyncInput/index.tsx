import {
  Flex,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  FormHelperText,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";

export const SyncInput = () => {
  const [password, setPassword] = useState(
    localStorage.getItem("password") ?? ""
  );

  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  return (
    <Flex direction="column" gap={2} pb={5}>
      <FormControl>
        <FormLabel>Sync phrase</FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="sync phrase"
            onChange={(e) => {
              const value = e.target.value;

              if (value) {
                localStorage.setItem("password", e.target.value);
                setPassword(e.target.value);
              }
            }}
            value={password}
          />
          <InputRightElement w="3rem">
            <IconButton
              variant="solid"
              h="1.75rem"
              size="sm"
              icon={<>{show ? "🙉" : "🙈"}</>}
              onClick={handleClick}
              aria-label={"show or hide sync phrase"}
            />
          </InputRightElement>
        </InputGroup>
        <FormHelperText>
          use this phrase on your other device to sync bucket data via web-rtc
        </FormHelperText>
      </FormControl>
      <Button onClick={() => window.location.reload()}>start syncing</Button>
    </Flex>
  );
};
