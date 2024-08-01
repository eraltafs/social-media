import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Jobseeker from './pages/ApplyJobSeeker';
const Google_Client_Id = import.meta.env.VITE_GOOGLE_CLIENT_ID

function PrivateRoute({ element, ...rest }) {
  const { token,user_id } = useSelector((state) => state.auth);

  const isAuthenticated = !!token || !!user_id;

  return isAuthenticated ? element : <Navigate to="/login" />;
}
function App() {
  return (
    <GoogleOAuthProvider clientId={Google_Client_Id}>

      <div className="App">
        <Routes>
          <Route path="/" element={<PrivateRoute element={<HomePage />} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/applyjobseeker" element={<Jobseeker />} />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
