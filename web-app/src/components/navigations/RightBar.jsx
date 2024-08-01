import { Box, Input, Text } from "@chakra-ui/react";
import React from "react";
import { InputGroup, InputLeftElement } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

function RightBar() {
  return (
    <Box className="h-full w-1/4">
      <InputGroup>
        <InputLeftElement
          pointerEvents="none"
          children={<SearchIcon color="gray.300" />}
        />
        <Input type="text" placeholder="Search user" />
      </InputGroup>

      <Box
        className="applyForVerification"
        textAlign={"left"}
        display="flex"
        flexDirection="column"
        gap="1.5"
        p="2.5"
        mt="3.5"
        boxShadow="0 5px 15px rgba(0, 0, 0, 0.35)"
      >
        <Text fontSize={"sm"} fontWeight={"500"}>
          Apply to Verification
        </Text>
        <Text fontSize={"xs"}>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text.
        </Text>
        <button className="RightBarApplyButton bg-white border border-blue-800 w-1/4 font-medium flex items-center justify-center py-1">
          Apply
        </button>
      </Box>
    </Box>
  );
}

export default RightBar;
