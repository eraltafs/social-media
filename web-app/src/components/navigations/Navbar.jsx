import { Box, Image, Button, Text } from "@chakra-ui/react";
import React from "react";
import { GoBellFill } from "react-icons/go";
import { RiMessage2Fill } from "react-icons/ri";
import { useSelector } from "react-redux";


function Navbar() {
  const { token, user_id, userdata } = useSelector((state) => state.auth);

  return (
    <Box className="flex items-center justify-around h-[70px] shadow-lg font-roboto">
      <Box className="w-1/5 ml-8">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/navbar-svg/NavbarCompanyLogo.svg" width={40} />
        
      </Box>
      <Box className="flex gap-2">
        <Button className="border border-black px-2 py-1 rounded">Trending</Button>
        <Button className="border border-black px-2 py-1 rounded">All</Button>
        <Button className="border border-black px-2 py-1 rounded">Professional</Button>
        <Button className="border border-black px-2 py-1 rounded">Organization</Button>
      </Box>
      <Box className="flex gap-10 w-1/3 items-center justify-around">
        <Box className="flex gap-8">

          <Box className="p-1 bg-gray-300 rounded-full">
          <RiMessage2Fill  style={{ width:"30px", height:"30px" }} />
          </Box>
          <Box className="p-1 bg-gray-300 rounded-full">
          <GoBellFill  style={{ width:"30px", height:"30px" }} />

          </Box>
        </Box>
        <Box className="flex gap-2 bg-gray-100 w-1/2 items-center">
          <Image
            src={userdata.avatar ? userdata.avatar : ""}
            className="w-16 h-16 rounded"
            alt="User Avatar"
          />
          <Box className="flex flex-col">
            <Text>
              {userdata.name
                ? userdata.name
                : userdata.first_name
                  ? userdata.first_name + (userdata.last_name ? " " + userdata.last_name : "")
                  : ""}
            </Text>
            <Text>@{userdata.username}</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Navbar;
