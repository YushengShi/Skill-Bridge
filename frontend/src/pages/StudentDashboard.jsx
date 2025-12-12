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

  // ==================== DATA FETCHING ====================

  /**
   * Fetch dashboard data on component mount.
   * In production, replace with actual API calls.
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // TODO: Replace with actual API calls
        // Simulating API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock stats data
        setStats({
          upcomingLessons: 3,
          completedLessons: 12,
          totalHours: 18,
          teachersWorkedWith: 4,
        });

        // Mock upcoming lessons
        setUpcomingLessons([
          {
            id: 1,
            teacherName: "English Teacher Roz",
            teacherAvatar: "https://i.pravatar.cc/150?img=5",
            subject: "English Conversation",
            date: "2024-12-15",
            time: "10:00 AM",
            duration: 60,
            status: "confirmed",
            meetingLink: "https://meet.google.com/abc-defg-hij",
          },
          {
            id: 2,
            teacherName: "Paul Interview Coach",
            teacherAvatar: "https://i.pravatar.cc/150?img=11",
            subject: "Interview Preparation",
            date: "2024-12-16",
            time: "2:00 PM",
            duration: 45,
            status: "confirmed",
            meetingLink: "https://zoom.us/j/123456789",
          },
          {
            id: 3,
            teacherName: "Maria Spanish Tutor",
            teacherAvatar: "https://i.pravatar.cc/150?img=9",
            subject: "Spanish Basics",
            date: "2024-12-18",
            time: "4:00 PM",
            duration: 60,
            status: "pending",
            meetingLink: null,
          },
        ]);

        // Mock recent activity
        setRecentActivity([
          {
            id: 1,
            type: "lesson_completed",
            message: "Completed lesson with English Teacher Roz",
            time: "2 hours ago",
            icon: "✅",
          },
          {
            id: 2,
            type: "file_reviewed",
            message: "Your homework was reviewed by Paul",
            time: "5 hours ago",
            icon: "📝",
          },
          {
            id: 3,
            type: "booking_confirmed",
            message: "Booking confirmed for Spanish Basics",
            time: "1 day ago",
            icon: "📅",
          },
          {
            id: 4,
            type: "payment_success",
            message: "Payment of $24 processed successfully",
            time: "2 days ago",
            icon: "💳",
          },
        ]);

        // Mock recommended teachers
        setRecommendedTeachers([
          {
            id: "1",
            name: "Sarah Language Pro",
            avatar: "https://i.pravatar.cc/150?img=32",
            subject: "Business English",
            rating: 4.9,
            price: 25,
          },
          {
            id: "2",
            name: "Mike Code Master",
            avatar: "https://i.pravatar.cc/150?img=12",
            subject: "Python Programming",
            rating: 5.0,
            price: 35,
          },
          {
            id: "3",
            name: "Lisa Music Teacher",
            avatar: "https://i.pravatar.cc/150?img=23",
            subject: "Piano Lessons",
            rating: 4.8,
            price: 30,
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ==================== EVENT HANDLERS ====================

  /**
   * Handles user logout - clears auth state and redirects to login
   */
  const handleLogout = () => {
    if (setIsAuthenticated) {
      setIsAuthenticated(false);
    }
    localStorage.removeItem("isAuth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
      {/* ==================== HEADER ==================== */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Student Dashboard</h1>
          <p className="welcome-text">Welcome back! Ready to learn today?</p>
        </div>
        <div className="header-right">
          <button
            className="header-btn profile-btn"
            onClick={() => navigate("/profile")}
          >
            👤 My Profile
          </button>
          <button className="header-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

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
                onClick={() => navigate("/profile")}
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
                onClick={() => alert("AI Recommendations coming soon!")}
              >
                <span className="action-icon">🤖</span>
                <span className="action-text">AI Suggestions</span>
              </button>
            </div>
          </section>

          {/* Recommended Teachers Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>⭐ Recommended For You</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/teachers")}
              >
                Browse All →
              </button>
            </div>

            <div className="recommended-teachers">
              {recommendedTeachers.map((teacher) => (
                <div key={teacher.id} className="teacher-mini-card">
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="teacher-mini-avatar"
                  />
                  <div className="teacher-mini-info">
                    <h4>{teacher.name}</h4>
                    <p>{teacher.subject}</p>
                    <div className="teacher-mini-meta">
                      <span className="rating">⭐ {teacher.rating}</span>
                      <span className="price">${teacher.price}/hr</span>
                    </div>
                  </div>
                  <button
                    className="book-mini-btn"
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
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

          {/* Learning Progress Section */}
          <section className="sidebar-section">
            <h3>📈 Learning Progress</h3>
            <div className="progress-card">
              <div className="progress-item">
                <div className="progress-header">
                  <span>English</span>
                  <span>75%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "75%" }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span>Interview Skills</span>
                  <span>40%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "40%" }}></div>
                </div>
              </div>
              <div className="progress-item">
                <div className="progress-header">
                  <span>Spanish</span>
                  <span>20%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "20%" }}></div>
                </div>
              </div>
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
                onClick={() => alert("AI Assistant coming soon!")}
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
