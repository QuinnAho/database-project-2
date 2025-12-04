// This is the content of the profile page
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsernameFromToken } from './utils'; // Helper function to get the username

const Profile = () => {
  const navigate = useNavigate();
  const username = getUsernameFromToken(); // Extract the username from the JWT token

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the JWT token from localStorage
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: '#007bff', marginBottom: '20px' }}>Welcome to Your profile page, {username}!</h2>
      
      {/* Navigation Menu */}
      <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <li><Link to="/" style={menuLinkStyle}>Home</Link></li>
          <li><Link to="/dashboard" style={menuLinkStyle}>Dashboard</Link></li>
          <li><Link to="/login" style={menuLinkStyle}>Login</Link></li>
          <li><Link to="/register" style={menuLinkStyle}>Register</Link></li>
          <li>
            <button
              onClick={handleLogout}
              style={{
                ...menuLinkStyle,  // Apply the same menu style to the logout button
                background: '#f5f5f5',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
      
      <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify', marginBottom: '20px' }}>
        This is your profile page. You can navigate to other pages using the links above.
      </p>

      {/* Explanation Paragraph */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1.5rem', color: '#007bff', marginBottom: '15px' }}>Understanding JWT-Based Access</h3>
        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.6' }}>
          Since we have implemented **JWT authentication**, you were able to navigate from the dashboard to this profile page 
          because the JWT token is stored in the browser’s **localStorage**. As long as the JWT token exists and is valid, 
          you can access private pages like this profile page.
        </p>
        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.6' }}>
          However, if you log out, the JWT token will be removed from **localStorage**, which means you will no longer 
          be authenticated. If you try to access this profile page after logging out, you will be redirected to the login page because 
          the site will no longer recognize you as a logged-in user. To test this, log out and then try to come back to the profile page 
          using the direct link—you will see that access is blocked.
        </p>
        <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.6' }}>
          This demonstrates how the **Profile** page acts as a **private page** that can only be accessed if the user is logged in. 
          Without a valid JWT token, the site will deny access to any private pages.
        </p>
      </div>
    </div>
  );
};

// Define the common styles for the menu links and buttons
const menuLinkStyle = {
  textDecoration: 'none',
  fontSize: '1.2rem',
  color: '#007bff',
  padding: '10px 20px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  display: 'inline-block',
  transition: 'background-color 0.3s',
};

// Add a hover effect for the links and buttons
menuLinkStyle[':hover'] = {
  backgroundColor: '#e0e0e0',
};

export default Profile;
