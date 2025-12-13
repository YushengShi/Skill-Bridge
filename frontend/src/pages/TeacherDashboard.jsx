/**
 * ================================================================================
 * TEACHER DASHBOARD COMPONENT
 * ================================================================================
 *
 * Main dashboard interface for teachers after login. Provides comprehensive
 * management tools for teaching activities including:
 * - Overview statistics (students, bookings, earnings)
 * - Today's schedule with lesson details
 * - Pending booking requests (approve/reject)
 * - Availability calendar management
 * - Teaching materials upload
 * - Student file submissions view
 * - Earnings overview
 *
 * @component TeacherDashboard
 * @route /teacher-dashboard
 * @requires Authentication (teacher role)
 *
 * Dependencies:
 * - React Router for navigation
 * - Backend API for data fetching
 * - TeacherDashboard.css for styling
 * ================================================================================
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_AVATAR } from "../constants";
import CalendarManager from "../components/CalendarManager";
import "./TeacherDashboard.css";

/**
 * TeacherDashboard Component
 *
 * Renders the teacher's main dashboard with management tools and analytics.
 * Fetches teacher data, bookings, and statistics on mount.
 *
 * @returns {JSX.Element} The teacher dashboard interface
 */
function TeacherDashboard() {
  // ==================== STATE MANAGEMENT ====================

  /**
   * Teacher profile data from backend
   * @type {Object|null}
   */
  const [teacher, setTeacher] = useState(null);

  /**
   * Loading state for initial data fetch
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);

  /**
   * Currently active tab in the dashboard
   * @type {'overview'|'schedule'|'bookings'|'materials'|'earnings'}
   */
  const [activeTab, setActiveTab] = useState("overview");

  /**
   * Selected date for availability calendar
   * @type {Date}
   */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * Visibility toggle for availability modal
   * @type {boolean}
   */
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  /**
   * Google Calendar connection status
   * @type {boolean}
   */
  const [calendarConnected, setCalendarConnected] = useState(false);

  /**
   * Upcoming availability events from Google Calendar
   * @type {Array}
   */
  const [availabilityEvents, setAvailabilityEvents] = useState([]);

  /**
   * Dashboard statistics from backend
   */
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingBookings: 0,
    todayLessons: 0,
    monthlyEarnings: 0,
    averageRating: 5.0,
    totalReviews: 0,
  });

  /**
   * Today's schedule from backend
   */
  const [todaySchedule, setTodaySchedule] = useState([]);

  /**
   * Pending booking requests from backend
   */
  const [pendingBookings, setPendingBookings] = useState([]);

  /**
   * Earnings data from backend
   */
  const [earningsData, setEarningsData] = useState({
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    available: 0,
    recentTransactions: [],
  });

  // Navigation hook for programmatic routing
  const navigate = useNavigate();

  // ==================== MATERIALS STATE ====================

  /**
   * Teaching materials - fetched from API
   * TODO: Implement API call when endpoint is ready
   */
  const [materials, setMaterials] = useState([]);

  /**
   * Student file submissions - fetched from API
   * TODO: Implement API call when endpoint is ready
   */
  const [studentSubmissions, setStudentSubmissions] = useState([]);

  // ==================== LIFECYCLE HOOKS ====================

  /**
   * Fetches all teacher dashboard data from the backend API on component mount.
   *
   * This single API call retrieves:
   * - teacher: Basic profile info (name, avatar, subject, verified status)
   * - stats: Summary metrics (students, bookings, lessons, earnings, rating)
   * - todaySchedule: Lessons scheduled for today with student info
   * - pendingBookings: Booking requests awaiting teacher approval
   * - earningsData: Financial summary and recent transactions
   *
   * Authentication is validated via JWT token in localStorage.
   * On auth failure (401/403), user is redirected to login.
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true); // Ensure loading is true at the start
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

        // Parse user data to get the teacher ID for the API call
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        // Fetch dashboard data with auth header
        const response = await fetch(`/api/teachers/${userId}/dashboard`, {
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
        setTeacher(data.teacher);
        setStats(data.stats);
        setTodaySchedule(data.todaySchedule);
        setPendingBookings(data.pendingBookings);
        setEarningsData(data.earningsData);

        // Fetch calendar status and events
        try {
          const calendarResponse = await fetch("/api/calendar/status", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const calendarData = await calendarResponse.json();
          setCalendarConnected(calendarData.connected);

          if (calendarData.connected) {
            const eventsResponse = await fetch("/api/calendar/events", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const eventsData = await eventsResponse.json();
            setAvailabilityEvents(eventsData.events || []);
          }
        } catch (error) {
          console.error("Error fetching calendar data:", error);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        // On error, set sensible defaults to prevent UI crashes
        setTeacher({
          name: "Teacher",
          avatar: DEFAULT_AVATAR,
          subject: "General",
          verified: false,
        });
        setStats({
          totalStudents: 0,
          pendingBookings: 0,
          todayLessons: 0,
          monthlyEarnings: 0,
          averageRating: 5.0,
          totalReviews: 0,
        });
        setTodaySchedule([]);
        setPendingBookings([]);
        setEarningsData({
          thisMonth: 0,
          lastMonth: 0,
          pending: 0,
          available: 0,
          recentTransactions: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]); // The navigate dependency is fine, the internal logic was the issue.

  // ==================== EVENT HANDLERS ====================  aichatbot.css, home.css, login.css, profile.css, studentDashboard.css, teacherDashboard.css, airecommendations.css, styles.css, teacherdetailspage.css, teacherprofile.css, app.css, index.css

  /**
   * Handle booking approval
   * Updates booking status to 'confirmed' and notifies student
   *
   * @param {number} bookingId - ID of the booking to approve
   */
  const handleApproveBooking = (bookingId) => {
    // TODO: Implement API call
    console.log("Approving booking:", bookingId);
    alert(`Booking ${bookingId} approved! Student will be notified.`);
  };

  /**
   * Handle booking rejection
   * Updates booking status to 'rejected' and notifies student
   *
   * @param {number} bookingId - ID of the booking to reject
   */
  const handleRejectBooking = (bookingId) => {
    // TODO: Implement API call with reason
    console.log("Rejecting booking:", bookingId);
    alert(`Booking ${bookingId} rejected.`);
  };

  /**
   * Handle file upload for teaching materials
   * Processes file and uploads to server
   *
   * @param {Event} e - File input change event
   */
  const handleMaterialUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implement file upload to server
      console.log("Uploading material:", file.name);
      alert(`Uploading: ${file.name}`);
    }
  };

  /**
   * Handle joining a lesson meeting
   * Opens meeting link in new tab
   *
   * @param {string} meetingLink - URL of the meeting
   */
  const handleJoinMeeting = (meetingLink) => {
    window.open(meetingLink, "_blank");
  };

  /**
   * Handle user logout
   * Clears authentication state and redirects to home
   */
  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  // ==================== RENDER HELPERS ====================

  /**
   * Render the statistics cards section
   * Displays key metrics at a glance
   */
  const renderStats = () => (
    <div className="stats-grid">
      <div className="stat-card primary">
        <div className="stat-icon">👨‍🎓</div>
        <div className="stat-info">
          <span className="stat-value">{stats.totalStudents}</span>
          <span className="stat-label">Total Students</span>
        </div>
      </div>
      <div className="stat-card warning">
        <div className="stat-icon">📋</div>
        <div className="stat-info">
          <span className="stat-value">{stats.pendingBookings}</span>
          <span className="stat-label">Pending Requests</span>
        </div>
      </div>
      <div className="stat-card info">
        <div className="stat-icon">📅</div>
        <div className="stat-info">
          <span className="stat-value">{stats.todayLessons}</span>
          <span className="stat-label">Today's Lessons</span>
        </div>
      </div>
      <div className="stat-card success">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <span className="stat-value">${stats.monthlyEarnings}</span>
          <span className="stat-label">This Month</span>
        </div>
      </div>
    </div>
  );

  /**
   * Render today's schedule section
   * Shows upcoming and current lessons
   */
  const renderSchedule = () => (
    <div className="schedule-section">
      <div className="section-header">
        <h2>📅 Today's Schedule</h2>
        <span className="date-display">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {todaySchedule.length > 0 ? (
        <div className="schedule-list">
          {todaySchedule.map((lesson) => (
            <div key={lesson.id} className={`schedule-item ${lesson.status}`}>
              <div className="schedule-time">
                <span className="time">{lesson.time}</span>
                <span className={`status-badge ${lesson.status}`}>
                  {lesson.status === "in-progress" ? "🔴 Live" : "⏰ Upcoming"}
                </span>
              </div>
              <div className="schedule-details">
                <img
                  src={lesson.studentAvatar}
                  alt={lesson.studentName}
                  className="student-avatar"
                />
                <div className="lesson-info">
                  <h4>{lesson.subject}</h4>
                  <p>with {lesson.studentName}</p>
                </div>
              </div>
              <div className="schedule-actions">
                <button
                  className={`join-btn ${
                    lesson.status === "in-progress" ? "active" : ""
                  }`}
                  onClick={() => handleJoinMeeting(lesson.meetingLink)}
                >
                  {lesson.status === "in-progress" ? "Join Now" : "Join"}
                </button>
                <button className="message-btn">💬</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-schedule">
          <span className="empty-icon">📭</span>
          <p>No lessons scheduled for today</p>
        </div>
      )}
    </div>
  );

  /**
   * Render pending booking requests section
   * Allows teacher to approve or reject bookings
   */
  const renderPendingBookings = () => (
    <div className="bookings-section">
      <div className="section-header">
        <h2>📋 Pending Booking Requests</h2>
        <span className="count-badge">{pendingBookings.length} pending</span>
      </div>

      {pendingBookings.length > 0 ? (
        <div className="bookings-list">
          {pendingBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <img
                  src={booking.studentAvatar}
                  alt={booking.studentName}
                  className="student-avatar"
                />
                <div className="booking-info">
                  <h4>{booking.studentName}</h4>
                  <span className="level-badge">{booking.studentLevel}</span>
                </div>
              </div>
              <div className="booking-details">
                <p>
                  <strong>Subject:</strong> {booking.subject}
                </p>
                <p>
                  <strong>Date:</strong> {booking.requestedDate}
                </p>
                <p>
                  <strong>Time:</strong> {booking.requestedTime}
                </p>
                <p className="booking-message">"{booking.message}"</p>
              </div>
              <div className="booking-actions">
                <button
                  className="approve-btn"
                  onClick={() => handleApproveBooking(booking.id)}
                >
                  ✓ Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleRejectBooking(booking.id)}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-bookings">
          <span className="empty-icon">✨</span>
          <p>No pending booking requests</p>
        </div>
      )}
    </div>
  );

  /**
   * Render teaching materials section
   * Shows uploaded materials and upload form
   */
  const renderMaterials = () => (
    <div className="materials-section">
      <div className="section-header">
        <h2>📚 Teaching Materials</h2>
        <label className="upload-btn">
          <input
            type="file"
            onChange={handleMaterialUpload}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4"
            hidden
          />
          + Upload New
        </label>
      </div>

      <div className="materials-grid">
        {materials.map((material) => (
          <div key={material.id} className="material-card">
            <div className="material-icon">
              {material.type === "PDF" && "📄"}
              {material.type === "PowerPoint" && "📊"}
              {material.type === "Word" && "📝"}
              {material.type === "Audio" && "🎵"}
            </div>
            <div className="material-info">
              <h4>{material.name}</h4>
              <p>
                {material.size} • {material.downloads} downloads
              </p>
            </div>
            <div className="material-actions">
              <button className="icon-btn" title="Share">
                🔗
              </button>
              <button className="icon-btn" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Student Submissions */}
      <div className="submissions-section">
        <h3>📥 Student Submissions</h3>
        <div className="submissions-list">
          {studentSubmissions.map((submission) => (
            <div key={submission.id} className="submission-item">
              <div className="submission-info">
                <span className="student-name">{submission.studentName}</span>
                <span className="file-name">{submission.fileName}</span>
                <span className="submitted-time">{submission.submittedAt}</span>
              </div>
              <div className="submission-actions">
                <button className="view-btn">View</button>
                <span className={`status ${submission.status}`}>
                  {submission.status === "pending" ? "⏳" : "✓"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Render earnings overview section
   * Shows financial summary and transactions
   */
  const renderEarnings = () => (
    <div className="earnings-section">
      <div className="earnings-overview">
        <div className="earnings-card main">
          <h3>Available Balance</h3>
          <span className="amount">${earningsData.available}</span>
          <button className="withdraw-btn">Withdraw Funds</button>
        </div>
        <div className="earnings-card">
          <h4>This Month</h4>
          <span className="amount">${earningsData.thisMonth}</span>
          <span className="change positive">+12% vs last month</span>
        </div>
        <div className="earnings-card">
          <h4>Pending</h4>
          <span className="amount">${earningsData.pending}</span>
          <span className="note">Processing...</span>
        </div>
      </div>

      <div className="transactions-section">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {earningsData.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <span className="student-name">{transaction.studentName}</span>
                <span className="date">{transaction.date}</span>
              </div>
              <div className="transaction-amount">
                <span className="amount">+${transaction.amount}</span>
                <span className={`status ${transaction.status}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Render availability management section
   * Shows Google Calendar connection status and upcoming availability
   */
  const renderAvailability = () => (
    <div className="availability-section">
      <div className="section-header">
        <h2>⏰ Manage Availability</h2>
        <button
          className="edit-availability-btn"
          onClick={() => setActiveTab("calendar")}
        >
          {calendarConnected ? "Manage Calendar" : "Connect Calendar"}
        </button>
      </div>

      <div className="calendar-status">
        {calendarConnected ? (
          <div className="connected-status">
            <span className="status-icon">✅</span>
            <span>Google Calendar Connected</span>
          </div>
        ) : (
          <div className="disconnected-status">
            <span className="status-icon">❌</span>
            <span>Google Calendar Not Connected</span>
            <p>
              Connect your Google Calendar to manage availability and sync
              bookings.
            </p>
          </div>
        )}
      </div>

      {calendarConnected && availabilityEvents.length > 0 && (
        <div className="upcoming-availability">
          <h3>Upcoming Availability</h3>
          <div className="events-list">
            {availabilityEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="event-item">
                <span className="event-date">
                  {new Date(
                    event.start.dateTime || event.start.date
                  ).toLocaleDateString()}
                </span>
                <span className="event-time">
                  {event.start.dateTime
                    ? `${new Date(event.start.dateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - ${new Date(event.end.dateTime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}`
                    : "All day"}
                </span>
                <span className="event-title">{event.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {calendarConnected && availabilityEvents.length === 0 && (
        <div className="no-availability">
          <p>
            No upcoming availability events found. Add availability slots in
            your Google Calendar.
          </p>
        </div>
      )}
    </div>
  );

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="teacher-dashboard">
      {/* Page Title Section */}
      <div className="dashboard-title-section">
        <h1>Teacher Dashboard</h1>
        <p className="welcome-text">
          Welcome back, {teacher?.name}! You have {stats.todayLessons} lessons
          today.
        </p>
      </div>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          📅 Schedule
        </button>
        <button
          className={`tab ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          🗓️ Availability
        </button>
        <button
          className={`tab ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          📋 Bookings
          {stats.pendingBookings > 0 && (
            <span className="notification-badge">{stats.pendingBookings}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === "materials" ? "active" : ""}`}
          onClick={() => setActiveTab("materials")}
        >
          📚 Materials
        </button>
        <button
          className={`tab ${activeTab === "earnings" ? "active" : ""}`}
          onClick={() => setActiveTab("earnings")}
        >
          💰 Earnings
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Statistics - Always visible */}
        {renderStats()}

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "overview" && (
            <>
              {/* Quick Actions Section */}
              <section className="dashboard-section quick-actions-section">
                <h2>⚡ Quick Actions</h2>
                <div className="quick-actions">
                  <button
                    className="action-card"
                    onClick={() => setActiveTab("calendar")}
                  >
                    <span className="action-icon">⏰</span>
                    <span className="action-text">Add Availability</span>
                  </button>
                  <button
                    className="action-card"
                    onClick={() => setActiveTab("materials")}
                  >
                    <span className="action-icon">📤</span>
                    <span className="action-text">Upload Material</span>
                  </button>
                  <button
                    className="action-card"
                    onClick={() => setActiveTab("bookings")}
                  >
                    <span className="action-icon">📋</span>
                    <span className="action-text">View Bookings</span>
                  </button>
                  <button
                    className="action-card"
                    onClick={() => setActiveTab("earnings")}
                  >
                    <span className="action-icon">💰</span>
                    <span className="action-text">Earnings</span>
                  </button>
                </div>
              </section>
              {renderSchedule()}
              {renderPendingBookings()}
              {renderAvailability()}
            </>
          )}

          {activeTab === "schedule" && renderSchedule()}

          {activeTab === "calendar" && <CalendarManager />}

          {activeTab === "bookings" && renderPendingBookings()}

          {activeTab === "materials" && renderMaterials()}

          {activeTab === "earnings" && renderEarnings()}
        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;
