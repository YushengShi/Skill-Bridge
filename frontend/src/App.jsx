import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { jwtDecode } from "jwt-decode";

import Login from "./components/Login";
import Navbar from "./components/Navbar";
import PaymentForm from "./pages/PaymentForm";
import TeacherHome from "./components/TeacherHome";
import TeacherProfile from "./pages/TeacherProfile";
import StudentProfile from "./pages/StudentProfile";
import TeacherOwnProfile from "./pages/TeacherOwnProfile";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";

import AIRecommendations from "./pages/AIRecommendations";
import AIChatbot, { ChatbotButton } from "./components/AIChatbot";
import "./App.css";
import StudentBookings from "./pages/StudentBookings";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const getHomeRoute = () => {
    if (userRole === "admin") return "/admin-dashboard";
    if (userRole === "teacher") return "/dashboard";
    if (userRole === "student") return "/dashboard";
    return "/login"; 
  };

  const isAdmin = userRole === "admin";

  if (isCheckingAuth) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div
        className={`app-wrapper ${
          isAdmin 
            ? "admin-theme" 
            : userRole === "teacher" ? "teacher-theme" : "student-theme"
        }`}
      >
        {isAuthenticated && !isAdmin && (
          <Navbar
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            setIsAuthenticated={setIsAuthenticated}
            setUserRole={setUserRole}
          />
        )}

        <Routes>
          <Route 
            path="/admin-login" 
            element={
              isAuthenticated && isAdmin ? (
                <Navigate to="/admin-dashboard" replace />
              ) : (
                <AdminLogin setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
              )
            } 
          />
          <Route
            path="/admin-dashboard"
            element={
              isAuthenticated && isAdmin ? (
                <AdminDashboard setIsAuthenticated={setIsAuthenticated} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

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
              isAuthenticated ? (
                <Navigate to={getHomeRoute()} replace />
              ) : (
                <Home />
              )
            }
          />

          <Route
            path="/teachers"
            element={isAuthenticated ? <TeacherHome setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" replace />}
          />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/checkout" element={<PaymentForm />} />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                userRole === "teacher" ? (
                  <TeacherDashboard setIsAuthenticated={setIsAuthenticated} />
                ) : userRole === "student" ? (
                  <StudentDashboard setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <Navigate to="/admin-dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route path="/student-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/teacher-dashboard" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                userRole === "student" ? (
                  <StudentProfile setIsAuthenticated={setIsAuthenticated} />
                ) : userRole === "teacher" ? (
                   <TeacherOwnProfile setIsAuthenticated={setIsAuthenticated} />
                ) : (
                   <Navigate to="/admin-dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/my-bookings"
            element={isAuthenticated && userRole === "student" ? <StudentBookings /> : <Navigate to="/login" replace />}
          />

          <Route
            path="/recommendations"
            element={isAuthenticated ? <AIRecommendations /> : <Navigate to="/login" replace />}
          />
          
          <Route
            path="/ai-chat"
            element={isAuthenticated ? <AIChatbot isFloating={false} userRole={userRole} /> : <Navigate to="/login" replace />}
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {isAuthenticated && !isAdmin && (
          <>
            <ChatbotButton
              onClick={() => setIsChatOpen(!isChatOpen)}
              isOpen={isChatOpen}
              userRole={userRole}
            />
            <AIChatbot
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              isFloating={true}
              userRole={userRole}
            />
          </>
        )}
      </div>
    </Router>
  );
}

export default App;