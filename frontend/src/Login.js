import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/login', { username, password });
      localStorage.setItem('token', res.data.token); // Save JWT token in localStorage
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: '#007bff', marginBottom: '20px' }}>Login</h2>

      {/* Navigation Menu */}
      <nav style={{ textAlign: 'center', marginBottom: '20px' }}>
        <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <li><Link to="/" style={menuLinkStyle}>Home</Link></li>
          <li><Link to="/dashboard" style={menuLinkStyle}>Dashboard</Link></li>
          <li><Link to="/profile" style={menuLinkStyle}>Profile</Link></li>  {/* Replaced Login link with Profile */}
          <li><Link to="/register" style={menuLinkStyle}>Register</Link></li>
        </ul>
      </nav>

      {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {/* Explanation Paragraph */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1.5rem', color: '#007bff', marginBottom: '15px' }}>What Happens After You Hit Login?</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
          Once you hit the login button, your credentials (username and password) are sent to the server. 
          If the login is successful, the server generates a **JWT (JSON Web Token)**, which is then returned to the client and saved in the browser’s **localStorage**.
        </p>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
          This **JWT** contains encrypted information about the user and serves as proof of authentication. 
          With this token stored in the browser, every time you visit a protected page (like the **Dashboard**), 
          the token is sent along with your request, and the server verifies whether the token is valid. 
          If the token is valid, you’re granted access to the private page.
        </p>
      </div>

      {/* JWT Storage Instruction Paragraph */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '1.5rem', color: '#007bff', marginBottom: '15px' }}>How to Check the JWT Token on Your Local PC</h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
          After logging in, the JWT token is stored in your browser’s **localStorage**. You can inspect it by following these steps:
        </p>
        <ul style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
          <li><strong>Step 1:</strong> Open your browser's **Developer Tools** by right-clicking anywhere on the page and selecting **Inspect** or by pressing `Ctrl + Shift + I` (Windows/Linux) or `Cmd + Option + I` (Mac).</li>
          <li><strong>Step 2:</strong> Navigate to the **Application** tab (or **Storage** tab in Firefox).</li>
          <li><strong>Step 3:</strong> In the left-hand panel, expand **Local Storage** and click on your site’s URL (e.g., `localhost`).</li>
          <li><strong>Step 4:</strong> Look for the key labeled **"token"**. The value associated with it is your JWT token.</li>
        </ul>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555' }}>
          You can also decode the JWT token to see its contents using tools like **[jwt.io](https://jwt.io/)** by pasting the token into their decoder.
        </p>
      </div>
    </div>
  );
};

// Define the common styles for the menu links
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

// Add a hover effect for the links
menuLinkStyle[':hover'] = {
  backgroundColor: '#e0e0e0',
};

export default Login;
