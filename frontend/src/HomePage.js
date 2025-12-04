import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const token = localStorage.getItem('token'); // Check if the user is logged in

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>Welcome to the JWT Tutorial Home Page</h1>
        <nav style={{ marginTop: '20px' }}>
          <ul style={{ listStyleType: 'none', padding: '0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <li><Link to="/login" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff' }}>Login</Link></li>
            <li><Link to="/register" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff' }}>Register</Link></li>
            {token && <li><Link to="/dashboard" style={{ textDecoration: 'none', fontSize: '1.2rem', color: '#007bff' }}>Dashboard</Link></li>}
          </ul>
        </nav>
      </header>

      {/* Session Information Paragraph */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2rem', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>Understanding Sessions: Stateful vs. Stateless</h2>
        <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
          A session is a temporary connection between a user and a system, allowing the system to remember the user's activity. 
          In a stateful session, the server keeps track of the user's session by storing information on the server side, using a session ID to recognize the user with each request. 
          On the other hand, in a stateless session, the server does not store any session data. Instead, the user's data, such as authentication information, is stored on the client side in a token, 
          like a JSON Web Token (JWT), which is sent with each request. APIs typically use stateless sessions for scalability and simplicity, since no session data is stored on the server.
        </p>
      </section>

      {/* Main Content */}
      <main>
        {/* JWT Tutorial Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>What is JWT (JSON Web Token)?</h2>
          <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
            JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact, URL-safe means of representing claims to be transferred between two parties. The claims in a JWT are encoded as a JSON object that is used for securely transmitting information between parties. JWTs are commonly used for **authentication** in web applications.
          </p>
          <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
            A JWT is composed of three parts:
          </p>
          <ul style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>
            <li><strong>Header</strong>: Contains metadata such as the type of token and signing algorithm used (e.g., HMAC SHA256).</li>
            <li><strong>Payload</strong>: Contains the claims or data being transmitted (e.g., user information like ID, username).</li>
            <li><strong>Signature</strong>: Used to verify that the token wasn’t tampered with. It's created by taking the encoded header, encoded payload, a secret, and the algorithm specified in the header.</li>
          </ul>
        </section>

        {/* How JWT Works Section with Image */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>How JWT Works</h2>
          <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
            Here’s a step-by-step breakdown of how JWT works in the context of authentication:
          </p>
          <ul style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>
            <li><strong>Step 1: User Login</strong> - The user enters their credentials (username and password) and submits them to the server via a login form.</li>
            <li><strong>Step 2: Server Generates JWT</strong> - If the credentials are valid, the server generates a JWT and sends it back to the client.</li>
            <li><strong>Step 3: Client Stores JWT</strong> - The client (browser or app) stores the JWT, usually in **localStorage** or **sessionStorage**.</li>
            <li><strong>Step 4: Client Sends JWT</strong> - For each subsequent request to a protected route, the client sends the JWT in the **Authorization** header.</li>
            <li><strong>Step 5: Server Verifies JWT</strong> - The server verifies the JWT using a secret key. If valid, the server processes the request and returns the response. If invalid or expired, the user is denied access.</li>
          </ul>

          {/* JWT Workflow Image */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <figure>
              <img 
                src="/jwtworkflow.jpeg" 
                alt="JWT Workflow Diagram" 
                style={{ maxWidth: '100%', height: 'auto' }} 
              />
              <figcaption style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>
                JWT Workflow Diagram. Image source: <a href="https://www.wallarm.com/what/oauth-vs-jwt-detailed-comparison" target="_blank" rel="noopener noreferrer">Wallarm</a>.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Project Overview Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>About This Project</h2>
          <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
            This project is a simple demonstration of stateless authentication using JWT. It includes:
          </p>
          <ul style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>
            <li>**Home Page**: This public page provides an overview of JWT and explains how it works.</li>
            <li>**Login**: Users can log in and receive a JWT, which is stored in the browser.</li>
            <li>**Register**: New users can register and create an account.</li>
            <li>**Dashboard**: A protected page that can only be accessed with a valid JWT.</li>
            <li>**Profile Page**: Another protected page that displays user information and can only be accessed with a valid JWT.</li>
          </ul>
          <p style={{ fontSize: '1.2rem', color: '#555', textAlign: 'justify' }}>
            The project helps developers understand how stateless authentication works using JWT and how it can be implemented in modern web applications.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
        <p style={{ fontSize: '0.9rem', color: '#777' }}>&copy; 2024 My Website. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
