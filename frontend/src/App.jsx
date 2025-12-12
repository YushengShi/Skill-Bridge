import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// 🌟 引入解析库
import { jwtDecode } from "jwt-decode";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decoded = jwtDecode(token);

          if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }

          setIsAuthenticated(true);
          setUserRole(decoded.role);
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  /**
   * Determines the appropriate home route based on user role.
   * Used for redirects after login and when accessing the root path.
   *
   * @returns {string} Route path for the user's dashboard or login page
   */
  const getHomeRoute = () => {
    if (userRole === "teacher") return "/teacher-dashboard";
    if (userRole === "student") return "/student-dashboard";
    return "/login"; // Fallback for unauthenticated or unknown role
  };

  if (isCheckingAuth) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getHomeRoute()} replace />
            ) : (
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            )
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? getHomeRoute() : "/login"}
              replace
            />
          }
        />

        {/* Public Routes */}
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
        <Route
          path="/teachers"
          element={<Navigate to="/teacherhome" replace />}
        />
        <Route path="/teachers/:id" element={<TeacherProfile />} />
        <Route path="/checkout" element={<PaymentForm />} />

        {/* Protected Routes - Student */}
        <Route
          path="/student-dashboard"
          element={
            isAuthenticated && userRole === "student" ? (
              <StudentDashboard setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate
                to={isAuthenticated ? "/teacher-dashboard" : "/login"}
                replace
              />
            )
          }
        />
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

        {/* Protected Routes - Teacher */}
        <Route
          path="/teacher-dashboard"
          element={
            isAuthenticated && userRole === "teacher" ? (
              <TeacherDashboard setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate
                to={isAuthenticated ? "/teacherhome" : "/login"}
                replace
              />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
