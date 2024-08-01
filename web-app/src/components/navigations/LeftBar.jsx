import { Box, Text, Image, Button } from "@chakra-ui/react";
import React from "react";
import { useNavigate } from "react-router-dom";



function LeftBar() {
  const navigate = useNavigate();

  return (
    <Box className="flex flex-col gap-4 mt-4 h-full w-1/5">
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/HomeLogo.svg" className="w-4 h-6" />
        <Text>Home</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/SocivoLogo.svg" className="w-4 h-6" />
        <Text>Socivo</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/CommunityLogo.svg" className="w-4 h-6" />
        <Text>Community</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/HireLogo.svg" className="w-4 h-6" />
        <Text>Hire suite</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/NewsLogo.svg" className="w-4 h-6" />
        <Text>News</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/NetworkingLogo.svg" className="w-4 h-6" />
        <Text>My Networking</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/WhatnewLogo.svg" className="w-4 h-6" />
        <Text>What's new</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/mentorLogo.svg" className="w-4 h-6" />
        <Text>MentorUp</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/DinentreLogo.svg" className="w-4 h-6" />
        <Text>Dinentrepreneur</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/SocilLogo.svg" className="w-4 h-6" />
        <Text>Socil - Coin</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/PremiumLogo.svg" className="w-4 h-6" />
        <Text>Premium</Text>
      </Box>
      <Box className="flex items-center gap-4">
        <Image src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/leftbar-svg/InviteFriends.svg" className="w-4 h-6" />
        <Text>Invite friends</Text>
      </Box>

      <Button
        onClick={() => {
          navigate("/login");
        }}
        className="mt-4"
      >
        Login
      </Button>
    </Box>
  );
}

export default LeftBar;
