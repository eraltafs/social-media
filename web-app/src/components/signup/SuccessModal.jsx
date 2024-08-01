// src/components/SuccessModal.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const SuccessModal = ({ isOpen, setModalOpen }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleExplore = () => {
    navigate("/");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded bg-white p-6 shadow-lg">
        <img
          src="https://orbiter-prod.blr1.digitaloceanspaces.com/web-app/gifs/success_mark.gif"
          alt="Success"
          className="mx-auto h-32 w-32"
        />
        <p className="mt-4 text-center">Success!</p>
        <button
          onClick={handleExplore}
          className="mt-4 w-full rounded bg-blue-500 px-4 py-2 text-white"
        >
          Explore Oribiter
        </button>
        <button
          onClick={() => setModalOpen(false)}
          className="mt-2 w-full rounded bg-gray-500 px-4 py-2 text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
