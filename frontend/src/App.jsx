import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { jwtDecode } from "jwt-decode";

import Login from "./components/Login";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import PaymentForm from "./pages/PaymentForm";
import TeacherHome from "./components/TeacherHome";
import TeacherProfile from "./pages/TeacherProfile";
import StudentProfile from "./pages/StudentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherDetailPage from "./pages/TeacherDetailPage";
import TeacherListPage from "./pages/TeacherListPage";

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

  /**
   * Determines the appropriate home route based on user role.
   * Both students and teachers are directed to /dashboard, which
   * renders the appropriate component based on their role.
   *
   * @returns {string} Route path - "/dashboard" for authenticated users, "/login" otherwise
   */
  const getHomeRoute = () => {
    if (userRole === "teacher") return "/dashboard";
    if (userRole === "student") return "/dashboard";
    return "/login"; // Fallback for unauthenticated or unknown role
  };

  if (isCheckingAuth) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      {/* Wrapper div applies role-based theme class for different color schemes */}
      <div
        className={`app-wrapper ${
          userRole === "teacher" ? "teacher-theme" : "student-theme"
        }`}
      >
        {/*
        GLOBAL NAVBAR
        Rendered outside of Routes so it appears on all pages.
        Receives auth state to show role-appropriate navigation.
        Hides itself on the login page.
      */}
        <Navbar
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          setIsAuthenticated={setIsAuthenticated}
          setUserRole={setUserRole}
        />
        <Routes>
          {/* Login route - redirects to dashboard if already authenticated */}
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

          {/* Teachers browsing page - accessible to both students and teachers */}
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
          {/* Individual teacher profile page */}
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          {/* Stripe checkout/payment page */}
          <Route path="/checkout" element={<PaymentForm />} />

          {/*
          UNIFIED DASHBOARD ROUTE
          Single /dashboard route that renders different components based on user role:
          - Teachers see TeacherDashboard
          - Students see StudentDashboard
          This simplifies navigation and avoids role-specific URLs.
        */}
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
          {/*
          LEGACY ROUTE REDIRECTS
          Old routes redirect to new unified /dashboard for backwards compatibility.
          This ensures bookmarks and external links still work.
        */}
          <Route
            path="/student-dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/teacher-dashboard"
            element={<Navigate to="/dashboard" replace />}
          />
          {/* Student profile page */}
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
            path="/profile"
            element={
              isAuthenticated ? (
                <StudentProfile setIsAuthenticated={setIsAuthenticated} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* AI-powered teacher recommendations questionnaire */}
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
          {/* Full-page AI chatbot interface */}
          <Route
            path="/ai-chat"
            element={
              isAuthenticated ? (
                <AIChatbot isFloating={false} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch-all route - redirects unknown paths to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/*
        FLOATING AI CHATBOT
        Appears as a floating action button (FAB) in the bottom-right corner
        for all authenticated users. Clicking toggles the chat window.
        Separate from the full-page /ai-chat route.
      */}
        {isAuthenticated && (
          <>
            <ChatbotButton
              onClick={() => setIsChatOpen(!isChatOpen)}
              isOpen={isChatOpen}
            />
            <AIChatbot
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              isFloating={true}
            />
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
