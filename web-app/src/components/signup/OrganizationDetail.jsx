import { Box } from "@chakra-ui/react";
import React from "react";

function OrganizationDetail({
  dob,
  setDob,
  items,
  setItems,
}) {
  return (
    <Box className="mt-4">
      <h1 className="text-left text-3xl font-bold ">Organization Details</h1>
      <Box className="m-auto flex w-[40%] flex-col gap-2 text-left">
        <Box>
          <label className="mb-2 text-left text-lg font-semibold">
            Established Date
          </label>
          <input
            type="date"
            className="w-full rounded-lg border-2 p-2"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </Box>
        <label className="mb-2 text-left text-lg font-semibold">Category</label>
        <input
          type="text"
          placeholder="Add your category"
          className="w-full rounded-lg border-2 p-2"
          value={items}
          onChange={(e) => setItems(e.target.value)}
        />
        <Box className=" grid grid-cols-3 items-center justify-between gap-y-2">
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${items == "Mentors" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setItems("Mentors")}
          >
            + Mentors{" "}
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${items == "Entreprenuers" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setItems("Entreprenuers")}
          >
            + Entreprenuers{" "}
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${items == "Student" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setItems("Student")}
          >
            + Student{" "}
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${items == "Investor" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setItems("Investor")}
          >
            + Investor{" "}
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${items == "Founder" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setItems("Founder")}
          >
            + Founder{" "}
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${items == "B - School" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setItems("B - School")}
          >
            + B - School
          </button>
        </Box>
      </Box>
    </Box>
  );
}

export default OrganizationDetail;
