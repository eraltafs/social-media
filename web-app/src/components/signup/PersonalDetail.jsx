import { Box } from "@chakra-ui/react";
import React from "react";

function PersonalDetailsStep({
  dob,
  setDob,
  countryCode,
  setCountryCode,
  phone,
  gender,
  setGender,
  location,
  countries,
  country,
  suggestions,
  handleSelectSuggestion,
  handleChangePhoneNumber,
  handleChangeLocation,
  handleChangeCountry,
}) {
  return (
    <Box className="mt-4">
      <h1 className="text-left text-3xl font-bold ">Personal Details</h1>
      <Box className="m-auto flex w-[40%] flex-col gap-2 text-left">
        <label className="mb-2 text-left text-lg font-semibold">
          Phone Number
        </label>
        <Box className="flex items-center overflow-hidden rounded-lg border-2 p-2">
          <input
            type="text"
            className="w-16 text-center"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          />
          <input
            type="text"
            className="flex-1 pl-2"
            placeholder="Enter phone number"
            value={phone}
            onChange={handleChangePhoneNumber}
          />
        </Box>
        <div>
          <label className="mb-2 text-lg font-semibold">Gender</label>
          <div className="flex justify-between gap-4">
            <button
              className={`flex flex-col items-center p-2 ${
                gender === "male" ? "border-blue-500" : "border-white"
              } rounded-lg border-2`}
              onClick={() => setGender("male")}
            >
              <img
                src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/signup-svg/MaleSelect.svg"
                alt="Male"
                className="h-8 w-8"
              />
              <span>Male</span>
            </button>
            <button
              className={`flex flex-col items-center p-2 ${
                gender === "female" ? "border-blue-500" : "border-white"
              } rounded-lg border-2`}
              onClick={() => setGender("female")}
            >
              <img
                src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/signup-svg/FemaleSelect.svg"
                alt="Female"
                className="h-8 w-8"
              />
              <span>Female</span>
            </button>
            <button
              className={`flex flex-col items-center p-2 ${
                gender === "others" ? "border-blue-500" : "border-white"
              } rounded-lg border-2`}
              onClick={() => setGender("others")}
            >
              <img
                src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/signup-svg/OtherSelect.svg"
                alt="Others"
                className="h-8 w-8"
              />
              <span>Others</span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 text-lg font-semibold">Date of Birth</label>
          <input
            type="date"
            className="w-full rounded-lg border-2 p-2"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 text-lg font-semibold">Location</label>
          <input
            type="text"
            placeholder="Add your address"
            className="w-full rounded-lg border-2 p-2"
            value={location}
            onChange={handleChangeLocation}
          />
          <ul className="mt-2 rounded-lg border-2">
            {suggestions.map((suggestion, index) => (
              <li
                onClick={() => handleSelectSuggestion(suggestion)}
                key={index}
                className="cursor-pointer border-b p-2 last:border-b-0 hover:bg-gray-100"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="mb-2 text-lg font-semibold">Country</label>
          <select
            className="w-full rounded-lg border-2 p-2"
            value={country}
            onChange={handleChangeCountry}
          >
            <option value="">Select Country</option>
            {countries?.map((countryObj) => (
              <option key={countryObj._id} value={countryObj.country}>
                {countryObj.country}
              </option>
            ))}
          </select>
        </div>
      </Box>
    </Box>
  );
}

export default PersonalDetailsStep;
