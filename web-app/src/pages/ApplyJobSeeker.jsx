import { Button, Box } from "@chakra-ui/react";
// import "../css/HomePage.css";

import axios from "axios";
import { useState } from "react";
import Navbar from "../components/navigations/Navbar";
import LeftBar from "../components/navigations/LeftBar";
import RightBar from "../components/navigations/RightBar";

function Jobseeker() {
  const [resume, setResume] = useState(null);

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const callPostApi = async () => {
    if (!resume) {
      console.error("Please select a file to upload.");
      return;
    }

    // Education data
    const education = {
      tenth: {
        institute_name: "10th Institute Name",
        course_type: "Full time",
        duration: "may 2024 - jun 2024",
      },
      twelfth: {
        institute_name: "12th Institute Name",
        course_type: "Full time",
        duration: "may 2024 - jun 2024",
      },
      graduation: {
        college_name: "Graduation College Name",
        course: "Graduation Course",
        course_type: "Full time",
        specialization: "Graduation Specialization",
        duration: "may 2024 - jun 2024",
      },
      post_graduation: {
        college_name: "Post Graduation College Name",
        course: "Post Graduation Course",
        course_type: "Full time",
        specialization: "Post Graduation Specialization",
        duration: "may 2024 - jun 2024",
      },
    };
    const projects = [
      {
        project_title: "Project Title 1",
        project_detail: "Project Detail 1",
        duration: "may 2024 - jun 2024",
        project_link: "Project Link 1",
      },
      {
        project_title: "Project Title 2",
        project_detail: "Project Detail 2",
        duration: "may 2024 - jun 2024",
        project_link: "Project Link 2",
      },
    ];
    // Experience data
    const experience = [
      {
        employment_type: "Full time",
        company_name: "Company Name 1",
        job_title: "Job Title 1",
        joining_date: "month-year",
        leaving_date: "month-year",
      },
      {
        employment_type: "Internship",
        company_name: "Company Name 2",
        job_title: "Job Title 2",
        joining_date: "month-year",
        leaving_date: "present",
      },
    ];
    const skills = ["Skill1", "Skill2"];
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("user_id", "6587aaf3fe9c8e211474b376");
    formData.append("title", "Job Title");
    formData.append("job_type", "Full time");
    formData.append("education", JSON.stringify(education));
    formData.append("projects", JSON.stringify(projects));
    formData.append("experience", JSON.stringify(experience));
    formData.append(
      "expected_salary",
      JSON.stringify({ min: 50000, max: 70000 }),
    );
    formData.append("mobile", "Mobile Number");
    formData.append("skills", JSON.stringify(skills));

    try {
      const res = await axios.post(
        "https://dev.orbiter.network/api/v1/hirings/createProfile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      console.log(res.data);
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <Box className="flex justify-evenly">
        <LeftBar />
        <Box className="mt-10 flex h-10 items-center">
          <p>Add your resume</p>
          <input type="file" onChange={handleFileChange} />
          <Button onClick={callPostApi}>Create Profile</Button>
        </Box>
        <RightBar />
      </Box>
    </div>
  );
}

export default Jobseeker;
