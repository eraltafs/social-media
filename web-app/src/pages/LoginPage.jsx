import React, { useRef, useState } from "react";
import { Box, Image, Spinner, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { handleGoogleLogin, loginUser } from "../redux/Auth/action";
import { MdOutlineAttachEmail } from "react-icons/md";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

import LoginRight from "../components/login/LoginRight";
import { URL } from "../utils/url";

function LoginPage() {
  const [emailLogin, setEmailLogin] = useState(false);
  const [sentOtp, setSentOtp] = useState(false);
  const [initial, setInitial] = useState(true);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const TextChange = (e) => {
    setEmail(e.target.value);
  };

  const submitEmailForm = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true before making the API call
    const payload = { email };
    try {
      let response = await axios.post(`${URL}/auth/sendotp`, payload);
      response = response.data;
      console.log("response.....", response);
      if (response.success) {
        setSentOtp(true);
        setEmailLogin(false);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setLoading(false); // Set loading state back to false after API call completes
    }
  };

  const handleChangeOtp = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    if (value && index < otp.length - 1) inputRefs.current[index + 1].focus();
    setOtp(newOtp);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      inputRefs.current[index - 1].focus();
      setOtp(newOtp);
    }
  };

  const submitOtpForm = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state to true before making the API call
    const newOtp = +otp[0] + otp[1] + otp[2] + otp[3];
    const payload = { email, otp: newOtp };
    try {
      dispatch(loginUser(payload, navigate));
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      setLoading(false); // Set loading state back to false after API call completes
    }
  };

  return (
    <Box className="ml-[5%] mr-[5%] flex h-screen justify-between">
      <Box className="w-1/2">
        <Image
          className="mt-2 w-1/4"
          src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/LoginLogo.svg"
          alt="logo"
        />

        <Box className="mt-[4%] flex flex-col items-center gap-[1.1rem]">
          <Box>
            <Text fontFamily={"Roboto"} fontSize={"xx-large"}>
              Welcome to <span className="text-[#085a87]">Orbiter</span>
            </Text>
            <Text fontFamily={"Roboto"} color={"#949494"}>
              Your ultimate platform for professional networking and growth.
            </Text>
          </Box>
        </Box>
        {initial && (
          <Box
            className="flex flex-col items-center justify-center"
            height="50vh"
            width="full"
          >
            <GoogleLogin
              style={{ backgroundColor: "black" }}
              className="px-300 my-8 flex w-4/6 items-center justify-center rounded-md bg-black py-3 text-white shadow-md"
              onSuccess={(credentialResponse) => {
                const googleToken = credentialResponse.credential;
                dispatch(handleGoogleLogin(googleToken, navigate));
              }}
              onError={() => {
                console.log("Login Failed");
              }}
            />

            <button
              className="px-300 my-8 flex w-4/6 items-center justify-center rounded-md bg-black py-3 text-white shadow-md"
              onClick={() => {
                setEmailLogin(true);
                setInitial(false);
              }}
            >
              <MdOutlineAttachEmail
                style={{ marginRight: "10px", width: "30px", height: "30px" }}
              />{" "}
              Continue with Email
            </button>
          </Box>
        )}
        {emailLogin && (
          <Box
            className="flex flex-col items-center justify-center"
            height="50vh"
            width="full"
          >
            <h1 className="text-3xl">Enter Your Email</h1>
            <form
              onSubmit={submitEmailForm}
              className="mt-[4%] flex w-full flex-col items-center gap-[1.1rem]"
              action=""
            >
              <input
                className="my-4 h-12 w-[90%] rounded-lg border border-gray-400 pl-5 text-lg"
                type="text"
                placeholder="Email address"
                name="email"
                required
                onChange={TextChange}
                value={email}
              />

              <button className="h-10 w-[90%] rounded-lg bg-[#085a87] font-thin text-white">
                {loading ? <Spinner size="sm" color="white" mr={2} /> : null}
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </Box>
        )}
        {sentOtp && (
          <Box
            className="flex flex-col items-center justify-center"
            height="50vh"
            width="full"
          >
            <h1 className="text-3xl">Enter OTP</h1>
            <Text fontFamily={"Roboto"} color={"#949494"}>
              A 4 digit code has been sent to {email}.
            </Text>
            <form onSubmit={submitOtpForm} action="">
              <div style={{ display: "block" }}>
                {otp.map((digit, index) => (
                  <input
                    className="mx-4 my-4 h-12 w-[10%] rounded-lg border border-gray-400 text-center text-lg"
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    autoFocus={index === 0}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    onChange={(e) => handleChangeOtp(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                  />
                ))}
              </div>
              <button className="h-10 w-1/2 rounded-lg bg-[#085a87] font-thin text-white">
                {loading ? <Spinner size="sm" color="white" mr={2} /> : null}
                {loading ? "Verifying OTP..." : "Verify Otp"}
              </button>
            </form>
          </Box>
        )}
      </Box>
      <Box className="w-[45%]">
        <LoginRight />
      </Box>
    </Box>
  );
}

export default LoginPage;
