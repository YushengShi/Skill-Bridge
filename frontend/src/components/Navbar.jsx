/**
 * ================================================================================
 * GLOBAL NAVBAR COMPONENT
 * ================================================================================
 *
 * A responsive Bootstrap-based navigation bar that appears across all pages
 * (except login). Provides role-based navigation for students and teachers.
 *
 * FEATURES:
 * - Role-based menu: Different nav links for students vs teachers
 * - Active state highlighting: Current page link is visually highlighted
 * - User dropdown: Profile access and logout functionality
 * - Responsive: Collapses to hamburger menu on mobile devices
 * - Hidden on login: Navbar doesn't show when user is not authenticated
 *
 * PROPS:
 * @param {boolean} isAuthenticated - Whether user is currently logged in
 * @param {string} userRole - Either "student" or "teacher"
 * @param {Function} setIsAuthenticated - Callback to update auth state on logout
 * @param {Function} setUserRole - Callback to clear user role on logout
 *
 * ROUTE STRUCTURE:
 * - /dashboard - Role-aware dashboard (shows StudentDashboard or TeacherDashboard)
 * - /teachers - Browse/find teachers page
 * - /recommendations - AI teacher recommendations (students only)
 * - /profile - Student profile page (students only)
 */
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar({
  isAuthenticated,
  userRole,
  setIsAuthenticated,
  setUserRole,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Handles user logout by clearing all auth data from localStorage
   * and resetting the app's authentication state
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserRole(null);
    navigate("/login");
  };

  // Hide navbar on login page since user isn't authenticated yet
  if (location.pathname === "/login") {
    return null;
  }

  // Extract user display name from localStorage
  // Teachers have a "name" field, students have firstName/lastName
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName =
    userRole === "teacher"
      ? user.name
      : `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm skill-navbar">
      <div className="container">
        {/* Brand logo - links to role-appropriate dashboard */}
        <Link
          className="navbar-brand d-flex align-items-center"
          to="/dashboard"
        >
          <i className="bi bi-mortarboard-fill me-2"></i>
          <span className="fw-bold">Skill Bridge</span>
        </Link>

        {/* Mobile hamburger toggle button - Bootstrap collapse trigger */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible nav content */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/*
            STUDENT NAVIGATION
            Students see: Dashboard, Find Teachers, AI Recommendations, My Profile
            Active state is determined by comparing current path with link target
          */}
          {isAuthenticated && userRole === "student" && (
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/dashboard" ? "active" : ""
                  }`}
                  to="/dashboard"
                >
                  <i className="bi bi-house-door me-1"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/teachers" ? "active" : ""
                  }`}
                  to="/teachers"
                >
                  <i className="bi bi-search me-1"></i>
                  Find Teachers
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/recommendations" ? "active" : ""
                  }`}
                  to="/recommendations"
                >
                  <i className="bi bi-stars me-1"></i>
                  AI Recommendations
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/profile" ? "active" : ""
                  }`}
                  to="/profile"
                >
                  <i className="bi bi-person me-1"></i>
                  My Profile
                </Link>
              </li>
            </ul>
          )}

          {/*
            TEACHER NAVIGATION
            Teachers see a simplified menu: Dashboard and Browse Teachers
            They don't have access to AI Recommendations or student-specific profile
          */}
          {isAuthenticated && userRole === "teacher" && (
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/dashboard" ? "active" : ""
                  }`}
                  to="/dashboard"
                >
                  <i className="bi bi-house-door me-1"></i>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    location.pathname === "/teachers" ? "active" : ""
                  }`}
                  to="/teachers"
                >
                  <i className="bi bi-people me-1"></i>
                  Browse Teachers
                </Link>
              </li>
            </ul>
          )}

          {/*
            USER DROPDOWN MENU (Right side)
            Shows user's name, role badge, and provides:
            - Profile link (students only)
            - Logout button
            Uses Bootstrap dropdown component
          */}
          {isAuthenticated && (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div className="user-avatar me-2">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <span className="d-none d-md-inline">
                    {userName ||
                      (userRole === "teacher" ? "Teacher" : "Student")}
                  </span>
                  <span className="badge ms-2 role-badge">
                    {userRole === "teacher" ? "Teacher" : "Student"}
                  </span>
                </a>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="userDropdown"
                >
                  {userRole === "student" && (
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i>
                        My Profile
                      </Link>
                    </li>
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
