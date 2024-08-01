import { Box } from "@chakra-ui/react";
import React from "react";
import { FiUpload } from "react-icons/fi";
import { RxAvatar } from "react-icons/rx";
import { RiCloseCircleLine } from "react-icons/ri";

function BasicInformationStep({
  type,
  avatar,
  setAvatar,
  showAvatars,
  setShowAvatars,
  name,
  setName,
  setFile,
}) {
  const renderIndividualAvatars = () => {
    const arr = [];
    if (type == 1) {
      for (let i = 0; i <= 11; i++) {
        arr.push(
          `https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/Ind-jpg/ind_${i}.jpg`,
        );
      }
    } else if (type == 2) {
      for (let i = 0; i <= 11; i++) {
        arr.push(
          `https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/org-jpg/org_${i}.jpg`,
        );
      }
    }
    return (
      <Box className="my-4 flex flex-wrap justify-center gap-2">
        {arr.map((element, i) => (
          <img
            key={i}
            className="w-[50px]"
            src={element}
            onClick={() => setAvatar(element)}
            alt={`Avatar ${i + 1}`}
          />
        ))}
      </Box>
    );
  };
  const handleImageUpload = (event) => {
    setShowAvatars(false);
    const file = event.target.files[0];
    setFile(file);
    setAvatar(URL.createObjectURL(file));
    console.log(file);
    // Send file to backend
    // Example: fetch('your-backend-url', { method: 'POST', body: file });
  };
  return (
    <Box className="mt-2">
      <h1 className="text-left text-3xl font-bold ">Basic Information</h1>
      <Box>
        <Box
          className={`m-auto mt-4 flex  ${avatar ? "w-fit" : "h-[100px] w-[100px]"} items-center justify-center  rounded-2xl bg-[#D9D9D9]`}
        >
          <Box>
            {avatar ? (
              <img
                className="h-[100px] w-[100px] overflow-hidden rounded-2xl"
                src={avatar}
                alt=""
              />
            ) : (
              <img
                src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/signup-svg/DummyCreateProfile.svg"
                alt=""
                width={40}
              />
            )}
          </Box>
        </Box>
        {showAvatars && renderIndividualAvatars()}
        <Box className="m-8 flex items-center justify-center gap-8">
          <label
            htmlFor="upload-photo"
            className="flex items-center gap-2 rounded-full px-4 py-1"
            style={{
              boxShadow: "0px 12px 45px 0px rgba(0, 0, 0, 0.14)",
              cursor: "pointer",
            }}
          >
            <FiUpload /> Upload Photo
            <input
              id="upload-photo"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </label>
          <button
            className="flex items-center gap-2 rounded-full px-4 py-1"
            style={{ boxShadow: "0px 12px 45px 0px rgba(0, 0, 0, 0.14)" }}
            onClick={() => setShowAvatars(true)}
          >
            <RxAvatar /> Upload Avatar
          </button>
        </Box>
        <Box className="relative">
          <input
            type="text"
            className="w-[40%] rounded p-2"
            style={{ border: "2px solid rgba(190, 190, 190, 1)" }}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
          {name && (
            <RiCloseCircleLine
              className="absolute right-80 top-1/2 -translate-y-1/2 transform cursor-pointer"
              size={20}
              onClick={() => setName("")}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default BasicInformationStep;
