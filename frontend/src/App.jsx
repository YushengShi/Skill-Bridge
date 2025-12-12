/**
 * ================================================================================
 * APP.JSX - MAIN APPLICATION COMPONENT
 * ================================================================================
 *
 * Root component for the SkillBridge application.
 * Handles routing, authentication state, and protected routes.
 *
 * Route Structure:
 * - /login - Authentication page
 * - /home - Student home page (browse teachers)
 * - /teacherhome - Teacher listing page
 * - /teachers/:id - Individual teacher profile
 * - /profile - Student's own profile page
 * - /student-dashboard - Student dashboard (protected)
 * - /teacher-dashboard - Teacher dashboard (protected)
 * - /checkout - Payment processing
 *
 * ================================================================================
 */

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import PaymentForm from "./pages/PaymentForm";
import TeacherHome from "./components/TeacherHome";
import TeacherProfile from "./pages/TeacherProfile";
import StudentProfile from "./pages/StudentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuth") === "true";
  });

  useEffect(() => {
    localStorage.setItem("isAuth", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/teacherhome" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <Home setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/checkout" element={<PaymentForm />} />
        <Route
          path="/teacherhome"
          element={
            isAuthenticated ? (
              <TeacherHome setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/teachers" element={<TeacherHome />} />
        <Route path="/teachers/:id" element={<TeacherProfile />} />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <StudentProfile setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Student Dashboard - Protected Route */}
        <Route
          path="/student-dashboard"
          element={
            isAuthenticated ? (
              <StudentDashboard setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Teacher Dashboard - Protected Route */}
        <Route
          path="/teacher-dashboard"
          element={
            isAuthenticated ? (
              <TeacherDashboard setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
