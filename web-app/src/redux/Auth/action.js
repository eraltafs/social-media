import { LOGINREQUESTSUCCESS } from "./actionType";
import axios from "axios";
import { URL } from "../../utils/url";

export const loginrequestSuccess = (payload) => {
  return { type: LOGINREQUESTSUCCESS, payload };
};

export const loginUser = (payload, navigate) => {
  return async (dispatch) => {
    try {
      let response = await axios.post(`${URL}/auth/verifyotp`, payload);

      response = response.data;
      const { token, isProfileCreated } = response;
      if (token) {
        dispatch(loginrequestSuccess(response));
        navigate("/");
      } else if (!isProfileCreated) {
        dispatch(loginrequestSuccess(response));
        navigate("/signup");
      }
    } catch (error) {
      console.error("error while login with otp :", error);
    }
  };
};

export const handleGoogleLogin = (googletoken, navigate) => {
  return async (dispatch) => {
    try {
      let response = await axios.post(`${URL}/auth/verifygoogleaccount`, {
        tokenId: googletoken,
      });

      response = response.data;
      const token = response?.token;
      if (token) {
        dispatch(loginrequestSuccess(response));
        navigate("/");
      } else if (!isProfileCreated) {
        navigate("/signup");
      }
    } catch (error) {
      console.error("Error while login with google:", error);
    }
  };
};

export const handleSignup = (formData, type, navigate, setModalOpen) => {
  return async (dispatch) => {
    try {
      let createProfileEndpoint;
      if (type == 1) createProfileEndpoint = "individualprofilecreate";
      if (type == 2) createProfileEndpoint = "organizationprofilecreate";
      let response = await axios.post(
        `${URL}/auth/${createProfileEndpoint}`,
        formData,
      );

      if (response.status === 200) {
        setModalOpen(true);
        let data = response.data;
        dispatch(loginrequestSuccess(data));
      } else {
        alert("signup again");
      }
    } catch (error) {
      console.error("Error while login with google:", error);
    }
  };
};
