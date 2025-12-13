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
import TeacherProfile from "./pages/TeacherProfile"; // 公开展示页
import StudentProfile from "./pages/StudentProfile"; // 学生个人中心
import TeacherOwnProfile from "./pages/TeacherOwnProfile"; // 🌟 老师个人中心 (编辑页)
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

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
    if (userRole === "teacher") return "/dashboard";
    if (userRole === "student") return "/dashboard";
    return "/login"; 
  };

  if (isCheckingAuth) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div
        className={`app-wrapper ${
          userRole === "teacher" ? "teacher-theme" : "student-theme"
        }`}
      >
        <Navbar
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          setIsAuthenticated={setIsAuthenticated}
          setUserRole={setUserRole}
        />
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

          <Route
            path="/teachers"
            element={
              isAuthenticated ? (
                <TeacherHome setIsAuthenticated={setIsAuthenticated} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/checkout" element={<PaymentForm />} />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                userRole === "teacher" ? (
                  <TeacherDashboard setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <StudentDashboard setIsAuthenticated={setIsAuthenticated} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/student-dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/teacher-dashboard"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                userRole === "student" ? (
                  <StudentProfile setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <TeacherOwnProfile setIsAuthenticated={setIsAuthenticated} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/my-bookings"
            element={
              isAuthenticated && userRole === "student" ? (
                <StudentBookings />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/recommendations"
            element={
              isAuthenticated ? (
                <AIRecommendations />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/ai-chat"
            element={
              isAuthenticated ? (
                <AIChatbot isFloating={false} userRole={userRole} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/*
        FLOATING AI CHATBOT
        Appears as a floating action button (FAB) in the bottom-right corner
        for all authenticated users. Clicking toggles the chat window.
        Shows different assistant based on user role:
        - Students: AI Teacher Finder
        - Teachers: AI Teaching Assistant
      */}
        {isAuthenticated && (
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