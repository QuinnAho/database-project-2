import React from 'react';
import { Navigate } from 'react-router-dom';  // Import the Navigate component to handle redirection

// PrivateRoute component to protect routes that require authentication
const PrivateRoute = ({ children }) => {
  // Retrieve the JWT token from localStorage
  const token = localStorage.getItem('token'); 
  
  // If the token exists, render the child components (protected content)
  // If no token exists, redirect the user to the login page
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
