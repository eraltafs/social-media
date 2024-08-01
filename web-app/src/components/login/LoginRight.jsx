import React, { useEffect, useRef, useState } from "react";
import { Box, Image, Text } from "@chakra-ui/react";


function LoginRight() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef(null);
  const totalSlides = 4; // Adjust this based on your content

  const nextSlide = () => {
    setCurrentSlide((currentSlide + 1) % totalSlides);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      nextSlide();
    }, 3000); // Autoplay interval (3 seconds)

    return () => clearInterval(intervalId);
  }, [currentSlide]);

  useEffect(() => {
    slideRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
  }, [currentSlide]);

  return (
    <Box
      className="carousel-container relative overflow-hidden"
      w="100%"
      h="100%"
      backgroundImage={`url(https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/LoginRightBg.svg)`}
    >
      <Box ref={slideRef} className="carousel-inner flex transition-transform duration-600 ease-in-out">
        <Box className="carousel-item flex-none w-full text-center">
          <Box className="login_right_text flex flex-col items-center justify-center mt-11 w-4/5 mx-auto h-28">
            <Text className="login_right_bigText text-white text-2xl font-roboto">
              Connect worldwide
            </Text>
            <Text className="login_right_smallText text-white text-lg font-roboto">
              Entrepreneurs, startups, mentors, investors, incubators, B schools.
            </Text>
          </Box>
          <Image
            className="login_right_image w-7/12 mt-5 mx-auto"
            src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/Login_right_connectpic.svg"
            alt="Slide 1"
          />
        </Box>

        <Box className="carousel-item flex-none w-full text-center">
          <Box className="login_right_text flex flex-col items-center justify-center mt-11 w-4/5 mx-auto h-28">
            <Text className="login_right_bigText text-white text-2xl font-roboto">
              Mentorship Hub
            </Text>
            <Text className="login_right_smallText text-white text-lg font-roboto">
              Orbiter connects startups, freelancers, interns with mentors.
            </Text>
          </Box>
          <Image
            className="login_right_image w-7/12 mt-5 mx-auto"
            src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/Login_right_mentor.svg"
            alt="Slide 2"
          />
        </Box>

        <Box className="carousel-item flex-none w-full text-center">
          <Box className="login_right_text flex flex-col items-center justify-center mt-11 w-4/5 mx-auto h-28">
            <Text className="login_right_bigText text-white text-2xl font-roboto">
              Join Community
            </Text>
            <Text className="login_right_smallText text-white text-lg font-roboto">
              Orbiter offers mentoring, professional communities on key topics.
            </Text>
          </Box>
          <Image
            className="login_right_image w-7/12 mt-5 mx-auto"
            src= "https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/Login_right_community.svg"
            alt="Slide 3"
          />
        </Box>

        <Box className="carousel-item flex-none w-full text-center">
          <Box className="login_right_text flex flex-col items-center justify-center mt-11 w-4/5 mx-auto h-28">
            <Text className="login_right_bigText text-white text-2xl font-roboto">
              Startup Jobs
            </Text>
            <Text className="login_right_smallText text-white text-lg font-roboto">
              Orbiter connects startups, freelancers and interns.
            </Text>
          </Box>
          <Image
            className="login_right_image w-7/12 mt-5 mx-auto"
            src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/Login_right_jobs.svg"
            alt="Slide 4"
          />
        </Box>
      </Box>
      <Box className="carousel-dots absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <span
            key={index}
            className={`dot w-2.5 h-2.5 rounded-full bg-gray-300 cursor-pointer ${currentSlide === index ? "bg-gray-500" : ""}`}
            onClick={() => setCurrentSlide(index)}
          ></span>
        ))}
      </Box>
    </Box>
  );
}

export default LoginRight;
