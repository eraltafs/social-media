import axios from "axios";
import { debounce } from "lodash";
import { Box, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { URL } from "../utils/url";
import Welcome from "../components/signup/Welcome";
import { handleSignup } from "../redux/Auth/action";
import SuccessModal from "../components/signup/SuccessModal";
import { useFetchCountries } from "../hooks/useFetchCountries";
import PersonalDetailsStep from "../components/signup/PersonalDetail";
import OrganizationDetail from "../components/signup/OrganizationDetail";
import OrganizationAddress from "../components/signup/OrganizationAddress";
import ProfessionalDetails from "../components/signup/ProfessionalDetails";
import BasicInformationStep from "../components/signup/BasicInformationStep";

function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showAvatars, setShowAvatars] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [suggestions, setSuggestions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [designation, setDesignation] = useState("");
  const [institute, setInstitute] = useState("");
  const [dob, setDob] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [file, setFile] = useState(null);

  const countries = useFetchCountries();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userdata } = useSelector((state) => state.authReducer);
  const steps = [1, 2, 3, 4];

  useEffect(() => {
    if (!userdata?.email) navigate("/login");
    if (userdata?.email) setEmail(userdata?.email);
    if (userdata?.name) setName(userdata?.name);
    if (userdata?.picture) setAvatar(userdata?.picture);
  }, []);

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    if (currentStep === 4) handleSubmit();
  };
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("avatar", avatar);
    formData.append("name", name);
    formData.append("gender", gender);
    formData.append("location", location);
    formData.append("designation", designation);
    formData.append("institute", institute);
    formData.append("dob", dob);
    formData.append("type", type);
    formData.append("items", items);
    formData.append("phone", phone);
    formData.append("country", country);

    if (file) formData.append("profilePhoto", file);

    dispatch(handleSignup(formData, type, navigate, setModalOpen));
  };

  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get(
        `${URL}/admin/locationSuggestion?query=${query}`,
      );
      const suggestions = response.data.data.features.map(
        (feature) => feature.properties.place_formatted,
      );
      setSuggestions(suggestions);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const debouncedFetchSuggestions = debounce(fetchSuggestions, 500); // Debounce fetchSuggestions

  const handleChangeLocation = (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length > 2) debouncedFetchSuggestions(value);
    else setSuggestions([]);
  };

  const handleSelectSuggestion = (suggestion) => {
    setLocation(suggestion);
    setSuggestions([]);
  };

  const handleChangePhoneNumber = (e) => {
    const value = e.target.value;

    const formattedValue = value.replace(/\D/g, "").slice(0, 10);
    setPhone(formattedValue);
  };
  const handleChangeCountry = (e) => {
    const inputValue = e.target.value.toLowerCase();
    const matchingCountry = countries.find(
      (country) => country.country.toLowerCase() === inputValue,
    );
    if (matchingCountry) setCountry(matchingCountry.country);
    else setCountry("");
  };

  const isButtonDisabled = () => {
    switch (currentStep) {
      case 1:
        return !type;
      case 2:
        return !avatar || !name;
      case 3:
        if (type === 1) {
          return (
            !phone ||
            phone.length <= 9 ||
            !gender ||
            !dob ||
            !location ||
            !country
          );
        } else if (type === 2) return !dob || !items;

        break;
      case 4:
        if (type === 1) return !items || !designation || !institute;
        else if (type === 2) return !location || !country;

        break;
      default:
        return false;
    }
  };

  return (
    <Box className="h-100vh m-auto mt-4 w-[80%]">
      <Image
        src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/login-svg/LoginLogo.svg"
        alt="logo"
        width={28}
      />
      <p className="mt-4 text-left text-[#7F7F7F]"> Step {currentStep} </p>
      <Box className="tex-left flex w-full max-w-full gap-3 ">
        {steps.map((step) => (
          <Box
            key={step}
            className={`h-2 flex-1 rounded text-left ${currentStep >= step ? "bg-yellow-500" : "bg-gray-300"}`}
          />
        ))}
      </Box>
      {currentStep == 1 && <Welcome type={type} setType={setType} />}
      {currentStep === 2 && (
        <BasicInformationStep
          type={type}
          setType={setType}
          avatar={avatar}
          setAvatar={setAvatar}
          showAvatars={showAvatars}
          setShowAvatars={setShowAvatars}
          name={name}
          setName={setName}
          setFile={setFile}
        />
      )}
      {currentStep === 3 && type == 1 && (
        <PersonalDetailsStep
          dob={dob}
          setDob={setDob}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          phone={phone}
          setPhone={setPhone}
          gender={gender}
          setGender={setGender}
          location={location}
          setLocation={setLocation}
          country={country}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          countries={countries}
          handleSelectSuggestion={handleSelectSuggestion}
          handleChangePhoneNumber={handleChangePhoneNumber}
          handleChangeCountry={handleChangeCountry}
          handleChangeLocation={handleChangeLocation}
        />
      )}
      {currentStep === 3 && type == 2 && (
        <OrganizationDetail
          dob={dob}
          setDob={setDob}
          items={items}
          setItems={setItems}
        />
      )}
      {currentStep === 4 && type == 1 && (
        <ProfessionalDetails
          items={items}
          setItems={setItems}
          setDesignation={setDesignation}
          designation={designation}
          institute={institute}
          setInstitute={setInstitute}
        />
      )}
      {currentStep === 4 && type == 2 && (
        <OrganizationAddress
          location={location}
          setLocation={setLocation}
          country={country}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          countries={countries}
          handleSelectSuggestion={handleSelectSuggestion}
          handleChangePhoneNumber={handleChangePhoneNumber}
          handleChangeCountry={handleChangeCountry}
          handleChangeLocation={handleChangeLocation}
        />
      )}

      <button
        className={`mb-2 mt-8 w-[40%] rounded p-2 text-[#FFFFFF] ${
          isButtonDisabled() ? "bg-[#BEBEBE]" : "bg-[blue]"
        }`}
        disabled={isButtonDisabled()}
        onClick={handleNextStep}
      >
        Next
      </button>
      <SuccessModal isOpen={modalOpen} setModalOpen={setModalOpen} />
    </Box>
  );
}

export default SignupPage;
