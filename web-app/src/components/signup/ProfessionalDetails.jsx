import { Box } from "@chakra-ui/react";
import React from "react";

function ProfessionalDetails({
  items,
  setItems,
  setDesignation,
  designation,
  institute,
  setInstitute,
}) {
  return (
    <Box className="mt-4">
      <h1 className="text-left text-3xl font-bold ">Professional Details</h1>
      <Box className="m-auto flex w-[70%] flex-col gap-2 text-left lg:w-[50%]">
        <label className="mb-2 text-left text-lg font-semibold">Category</label>
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
        <label className="mt-1 text-left text-lg font-semibold">
          Designation
        </label>
        <input
          type="text"
          placeholder="Add your designation"
          className="w-full rounded-lg border-2 p-2"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
        />
        <Box className=" grid grid-cols-3 items-center justify-between gap-y-2">
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "UX Designer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("UX Designer")}
          >
            + UX Designer
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "UI Designer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("UI Designer")}
          >
            + UI Designer
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "UX/UI Designer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("UX/UI Designer")}
          >
            + UX/UI Designer
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "Frontend Developer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("Frontend Developer")}
          >
            + Frontend Developer
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "Backend Developer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("Backend Developer")}
          >
            + Backend Developer
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "Android Developer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("Android Developer")}
          >
            + Android Developer
          </button>
          <button
            className={`max-w-fit rounded-full border px-2 text-xs ${designation == "Fullstack Developer" ? "bg-[blue] text-white" : ""}`}
            onClick={() => setDesignation("Fullstack Developer")}
          >
            + Fullstack Developer
          </button>
        </Box>
        <Box className="mt-2">
          <input
            type="text"
            placeholder="Add your institute"
            className="w-full rounded-lg border-2 p-2"
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProfessionalDetails;
