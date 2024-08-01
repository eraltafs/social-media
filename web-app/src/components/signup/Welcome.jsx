import { Box } from '@chakra-ui/react'
import React from 'react'

function Welcome({
  type,
    setType,
   
  }) {
  return (
    <Box>
          <Box className="mt-[1%] flex flex-col justify-center gap-[1.1rem]">
            <p className="text-left font-semibold text-[#085A87] ">
              Welcome to Orbiter
            </p>
            <h1 className="mt-[-2%] text-left text-3xl font-bold">
              Choose Your Profile Type
            </h1>
            <p className=" mt-[-1%] text-left text-[#7F7F7F]">
              Select the profile type that best represents you: Individual or
              Organization. Whether you're a professional seeking personal
              connections or representing a company or group, choose the option
              that aligns with your identity and objectives on Orbiter.
            </p>
          </Box>
          <Box className="mt-[5%] flex justify-center gap-[10%]">
            <Box className="w-[20%]">
              <Box
                className={`relative h-[100px] w-[180px] rounded-3xl ${type === 1 ? "bg-[#085A87]" : "bg-[#DFFBFF]"}`}
                onClick={() => setType(1)}
              >
                <img
                  src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/signup-svg/AccountType01logo.svg"
                  alt=""
                  className="absolute left-1/2 top-[-30%] -translate-x-1/2 transform"
                  width={80}
                />
                <h1
                  className={`absolute left-1/2 top-[65%] w-full -translate-x-1/2 transform text-center text-2xl font-semibold  ${type === 1 ? "text-[white]" : "text-[#085A87]"}`}
                >
                  Individual
                </h1>
              </Box>
              <p className="mt-2 text-xs text-[#7F7F7F]">
                Empower your professional journey:{" "}
                <strong>Share, engage, network</strong> , and seek{" "}
                <strong>mentorship</strong> opportunities
              </p>
            </Box>
            <Box className="w-[20%]">
              <Box
                className={`relative h-[100px] w-[180px] rounded-3xl ${type === 2 ? "bg-[#085A87]" : "bg-[#F5DFFF]"} `}
                onClick={() => setType(2)}
              >
                <img
                  src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/signup-svg/AccountType02logo.svg"
                  alt=""
                  className="absolute left-1/2 top-[-30%] -translate-x-1/2 transform"
                  width={80}
                />
                <h1
                  className={`absolute left-1/2 top-[65%] w-full -translate-x-1/2 transform text-center text-2xl font-semibold ${type === 2 ? "text-[white]" : "text-[#085A87]"}`}
                >
                  Organization
                </h1>
              </Box>
              <p className="mt-2 text-xs text-[#7F7F7F]">
                Amplify your organization's presence: Engage with the{" "}
                <strong>community, share insights, recruit talent,</strong> and
                foster <strong>mentorship</strong> opportunities
              </p>
            </Box>
          </Box>
        </Box>
  )
}

export default Welcome