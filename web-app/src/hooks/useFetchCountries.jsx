import { useEffect, useState } from "react";
import { URL } from "../utils/url";

export const useFetchCountries = () => {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchCountriesData = async () => {
      try {
        const response = await fetch(`${URL}/auth/country`);
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    fetchCountriesData();
  }, []);

  return countries;
};
