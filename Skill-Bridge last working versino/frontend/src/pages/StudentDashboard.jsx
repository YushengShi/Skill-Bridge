import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

/**
 * ================================================================================
 * STUDENT DASHBOARD COMPONENT
 * ================================================================================
 *
 * PURPOSE:
 * Main dashboard for students after login. Provides an overview of their
 * learning activity and quick access to key features.
 *
 * FEATURES:
 * - Stats overview (upcoming lessons, completed, total hours, teachers)
 * - Upcoming lessons with join/reschedule options
 * - Quick actions (Find Teachers, My Bookings, Upload Files, AI Recommendations)
 * - Recent activity feed
 * - Recommended teachers section
 * - Progress tracking
 *
 * ROUTE: /student-dashboard (protected - requires authentication)
 *
 * @component
 * @param {Object} props
 * @param {Function} props.setIsAuthenticated - Callback to update auth state on logout
 */
export default function StudentDashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================

  // Loading state for async data fetching
  const [loading, setLoading] = useState(true);

  // Student's upcoming lessons
  const [upcomingLessons, setUpcomingLessons] = useState([]);

  // Recent activity feed
  const [recentActivity, setRecentActivity] = useState([]);

  // Dashboard statistics
  const [stats, setStats] = useState({
    upcomingLessons: 0,
    completedLessons: 0,
    totalHours: 0,
    teachersWorkedWith: 0,
  });

  // Recommended teachers based on interests
  const [recommendedTeachers, setRecommendedTeachers] = useState([]);

  // Learning progress data - array of { subject, progress } for skill tracking bars
  const [learningProgress, setLearningProgress] = useState([]);

  // ==================== DATA FETCHING ====================

  /**
   * Fetches all dashboard data from the backend API on component mount.
   *
   * This single API call retrieves:
   * - stats: Summary metrics (lessons count, hours, teachers)
   * - upcomingLessons: Next scheduled lessons with teacher info
   * - recentActivity: Recent booking/payment activity feed
   * - recommendedTeachers: AI-suggested teachers based on interests
   * - learningProgress: Subject progress percentages for visualization
   *
   * Authentication is validated via JWT token in localStorage.
   * On auth failure (401/403), user is redirected to login.
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Retrieve authentication credentials from localStorage
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        // Redirect to login if no valid auth found
        if (!token || !userStr) {
          console.error("No authentication found");
          navigate("/login");
          return;
        }

        // Parse user data to get the student ID for the API call
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        // Fetch dashboard data with auth header
        const response = await fetch(`/api/students/${userId}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`, // JWT for protected route
            "Content-Type": "application/json",
          },
        });

        // Handle authentication errors - clear local storage and redirect
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        // Populate all state variables from the API response
        setStats(data.stats);
        setUpcomingLessons(data.upcomingLessons);
        setRecentActivity(data.recentActivity);
        setRecommendedTeachers(data.recommendedTeachers);
        setLearningProgress(data.learningProgress || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default empty states on error
        setStats({
          upcomingLessons: 0,
          completedLessons: 0,
          totalHours: 0,
          teachersWorkedWith: 0,
        });
        setUpcomingLessons([]);
        setRecentActivity([]);
        setRecommendedTeachers([]);
        setLearningProgress([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // ==================== EVENT HANDLERS ====================

  /**
   * Handles user logout - clears auth state and redirects to login
   */
  const handleLogout = async () => {
    try {
      await fetch("/api/students/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  /**
   * Joins a lesson meeting via the provided link
   * @param {string} meetingLink - URL to the meeting
   */
  const handleJoinLesson = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
    }
  };

  /**
   * Navigates to reschedule a specific lesson
   * @param {number} lessonId - ID of the lesson to reschedule
   */
  const handleReschedule = (lessonId) => {
    // TODO: Implement reschedule modal or navigate to reschedule page
    console.log("Reschedule lesson:", lessonId);
    alert("Reschedule feature coming soon!");
  };

  // ==================== RENDER HELPERS ====================

  /**
   * Formats a date string into a readable format
   * @param {string} dateStr - ISO date string
   * @returns {string} Formatted date (e.g., "Sun, Dec 15")
   */
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="student-dashboard">
      {/* ==================== PAGE TITLE ==================== */}
      <div className="dashboard-title-section">
        <h1>Student Dashboard</h1>
        <p className="welcome-text">Welcome back! Ready to learn today?</p>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-icon upcoming">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.upcomingLessons}</span>
            <span className="stat-label">Upcoming Lessons</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.completedLessons}</span>
            <span className="stat-label">Completed Lessons</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon hours">⏱️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalHours}h</span>
            <span className="stat-label">Learning Hours</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teachers">👨‍🏫</div>
          <div className="stat-info">
            <span className="stat-value">{stats.teachersWorkedWith}</span>
            <span className="stat-label">Teachers</span>
          </div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="dashboard-content">
        {/* Left Column - Upcoming Lessons */}
        <div className="dashboard-main">
          {/* Upcoming Lessons Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>📚 Upcoming Lessons</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/profile")}
              >
                View All →
              </button>
            </div>

            <div className="lessons-list">
              {upcomingLessons.length > 0 ? (
                upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="lesson-card">
                    <img
                      src={lesson.teacherAvatar}
                      alt={lesson.teacherName}
                      className="lesson-avatar"
                    />
                    <div className="lesson-info">
                      <h4>{lesson.subject}</h4>
                      <p className="lesson-teacher">{lesson.teacherName}</p>
                      <p className="lesson-time">
                        📅 {formatDate(lesson.date)} at {lesson.time} •{" "}
                        {lesson.duration} min
                      </p>
                    </div>
                    <div className="lesson-actions">
                      <span className={`lesson-status ${lesson.status}`}>
                        {lesson.status === "confirmed"
                          ? "Confirmed"
                          : "Pending"}
                      </span>
                      {lesson.status === "confirmed" && lesson.meetingLink && (
                        <button
                          className="join-btn"
                          onClick={() => handleJoinLesson(lesson.meetingLink)}
                        >
                          Join
                        </button>
                      )}
                      <button
                        className="reschedule-btn"
                        onClick={() => handleReschedule(lesson.id)}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📅</span>
                  <h3>No upcoming lessons</h3>
                  <p>Book a lesson with a teacher to get started!</p>
                  <button onClick={() => navigate("/teachers")}>
                    Find a Teacher
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions Section */}
          <section className="dashboard-section">
            <h2>⚡ Quick Actions</h2>
            <div className="quick-actions">
              <button
                className="action-card"
                onClick={() => navigate("/teachers")}
              >
                <span className="action-icon">🔍</span>
                <span className="action-text">Find Teachers</span>
              </button>
              <button
                className="action-card"
                onClick={() => navigate("/my-bookings")}
              >
                <span className="action-icon">📅</span>
                <span className="action-text">My Bookings</span>
              </button>
              <button
                className="action-card"
                onClick={() => navigate("/profile")}
              >
                <span className="action-icon">📁</span>
                <span className="action-text">Upload Files</span>
              </button>
              <button
                className="action-card"
                onClick={() => navigate("/recommendations")}
              >
                <span className="action-icon">🤖</span>
                <span className="action-text">AI Suggestions</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column - Activity & Progress */}
        <aside className="dashboard-sidebar">
          {/* Recent Activity Section */}
          <section className="sidebar-section">
            <h3>🕒 Recent Activity</h3>
            <div className="activity-feed">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <span className="activity-icon">{activity.icon}</span>
                  <div className="activity-content">
                    <p>{activity.message}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/*
            Learning Progress Section
            Displays the student's progress in each subject they're learning.
            Data is fetched from the backend and stored in the learningProgress state.
            Each item has a subject name and a percentage (0-100) rendered as a progress bar.
          */}
          <section className="sidebar-section">
            <h3>📈 Learning Progress</h3>
            <div className="progress-card">
              {/* Render progress bars if data exists, otherwise show empty state */}
              {learningProgress.length > 0 ? (
                learningProgress.map((item, index) => (
                  <div key={index} className="progress-item">
                    {/* Header shows subject name and percentage value */}
                    <div className="progress-header">
                      <span>{item.subject}</span>
                      <span>{item.progress}%</span>
                    </div>
                    {/* Visual progress bar - width is dynamically set to match progress % */}
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                // Empty state shown when student has no learning progress recorded
                <div className="empty-progress">
                  <p>No learning progress yet. Book a lesson to get started!</p>
                </div>
              )}
            </div>
          </section>

          {/* AI Assistant Promo */}
          <section className="sidebar-section ai-promo">
            <div className="ai-promo-content">
              <span className="ai-icon">🤖</span>
              <h3>Need Help Finding a Teacher?</h3>
              <p>Our AI assistant can recommend the perfect teacher for you!</p>
              <button
                className="ai-btn"
                onClick={() => navigate("/recommendations")}
              >
                Get Recommendations
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
