import { Box } from "@chakra-ui/react";
import React from "react";

function OrganizationAddress({
  location,
  countries,
  country,
  suggestions,
  handleSelectSuggestion,
  handleChangeLocation,
  handleChangeCountry,
})
{
   console.log("suggestions in organization",suggestions)
  return (
    <Box className="mt-4">
      <h1 className="text-left text-3xl font-bold ">Organization Address</h1>
      <Box className="m-auto flex w-[70%] flex-col gap-2 text-left lg:w-[50%]">
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

export default OrganizationAddress;
