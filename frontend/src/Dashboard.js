// This is the code for Dashboard page
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  // Log out function to clear the token and redirect to login page
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the JWT token
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>Dashboard</h2>
      
      {/* Menu - Home, Profile, Logout */}
      <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center' }}>
          <li>
            <Link to="/" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/profile" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff', padding: '10px 20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              Profile
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              style={{
                fontSize: '1.2rem',
                color: '#007bff',
                backgroundColor: '#f5f5f5',
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify', marginBottom: '20px' }}>
        Welcome to the dashboard. You are successfully logged in. After logging in, we’ve set up the code to redirect you here. 
        This allows you to understand how private pages can be accessed using **JWT (JSON Web Token)**.
      </p>
      
      <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
        Now that you’re authenticated, you can also navigate to other private pages, like the Profile page. 
        When you click on the **Profile** link, the website checks your JWT token to verify that you’re logged in and authorized to view the page. 
        This process ensures that only authenticated users have access to protected areas of the site.
      </p>

      <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
        Please note that if you are not logged in and attempt to access this dashboard directly by entering the URL 
        <strong> http://localhost:3000/dashboard </strong> in your browser, you will be redirected to the login page. 
        This is because the website checks for a valid **JWT token** before granting access to private pages like the dashboard.
      </p>
    </div>
  );
};

export default Dashboard;
