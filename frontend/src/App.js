// Author: Anik Tahabilder
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  // Importing routing components from react-router-dom
import HomePage from './HomePage';  // Importing the HomePage component
import Login from './Login';  // Importing the Login component
import Register from './Register';  // Importing the Register component
import Dashboard from './Dashboard';  // Importing the Dashboard component
import Profile from './Profile';  // Importing the Profile component
import PrivateRoute from './PrivateRoute';  // Importing the PrivateRoute component for protected routes

function App() {
  return (
    <Router>  {/* BrowserRouter provides the routing context to the application */}
      <Routes>  {/* Defines the routing paths for the application */}
        
        {/* Public routes */}
        {/* Route for HomePage (accessible to everyone) */}
        <Route path="/" element={<HomePage />} />
        
        {/* Route for Login (accessible to everyone) */}
        <Route path="/login" element={<Login />} />
        
        {/* Route for Register (accessible to everyone) */}
        <Route path="/register" element={<Register />} />

        {/* Private routes */}
        {/* Dashboard route, protected by PrivateRoute (only accessible if authenticated) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />  {/* Renders Dashboard if user is authenticated */}
            </PrivateRoute>
          }
        />

        {/* Profile route, protected by PrivateRoute (only accessible if authenticated) */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />  {/* Renders Profile if user is authenticated */}
            </PrivateRoute>
          }
        />
        
      </Routes>
    </Router>
  );
}

export default App;
