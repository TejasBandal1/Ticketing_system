import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TicketManagement from "./components/TicketManagement";
import ChatPage from "./components/ChatPage";
import LoginPage from "./pages/LoginPage";
import TechDashboard from "./pages/TechDashboard"; // Correct import from pages

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(""); // Track user's role

  useEffect(() => {
    // Check if the user is already logged in when the app loads
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem("userRole", role); // Store role
  };

  const PrivateRoute = ({ children, roleRequired }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" />; // Redirect to login if not logged in
    }
    if (roleRequired && userRole !== roleRequired) {
      return <Navigate to="/dashboard" />; // Redirect if the user does not have the required role
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage onLogin={handleLogin} />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/ticket-management"
          element={
            <PrivateRoute>
              <TicketManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:ticketId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />

        {/* Tech Dashboard Route */}
        <Route
          path="/tech-dashboard"
          element={
            <PrivateRoute roleRequired="tech">
              <TechDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
