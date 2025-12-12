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

  // Navigation hook for programmatic routing
  const navigate = useNavigate();

  // ==================== MOCK DATA ====================
  // TODO: Replace with actual API calls

  /**
   * Mock dashboard statistics
   * In production, fetch from /api/teachers/stats endpoint
   */
  const stats = {
    totalStudents: 24,
    pendingBookings: 3,
    todayLessons: 4,
    monthlyEarnings: 2450,
    averageRating: 4.8,
    totalReviews: 47,
  };

  /**
   * Mock today's schedule
   * In production, fetch from /api/bookings/today endpoint
   */
  const todaySchedule = [
    {
      id: 1,
      studentName: "Emma Wilson",
      studentAvatar: "https://randomuser.me/api/portraits/women/1.jpg",
      subject: "Spanish Conversation",
      time: "09:00 AM - 10:00 AM",
      status: "upcoming",
      meetingLink: "https://meet.example.com/abc123",
    },
    {
      id: 2,
      studentName: "James Chen",
      studentAvatar: "https://randomuser.me/api/portraits/men/2.jpg",
      subject: "Spanish Grammar",
      time: "11:00 AM - 12:00 PM",
      status: "in-progress",
      meetingLink: "https://meet.example.com/def456",
    },
    {
      id: 3,
      studentName: "Sophie Brown",
      studentAvatar: "https://randomuser.me/api/portraits/women/3.jpg",
      subject: "Spanish for Business",
      time: "02:00 PM - 03:00 PM",
      status: "upcoming",
      meetingLink: "https://meet.example.com/ghi789",
    },
    {
      id: 4,
      studentName: "Michael Lee",
      studentAvatar: "https://randomuser.me/api/portraits/men/4.jpg",
      subject: "Beginner Spanish",
      time: "04:00 PM - 05:00 PM",
      status: "upcoming",
      meetingLink: "https://meet.example.com/jkl012",
    },
  ];

  /**
   * Mock pending booking requests
   * In production, fetch from /api/bookings/pending endpoint
   */
  const pendingBookings = [
    {
      id: 1,
      studentName: "Alex Johnson",
      studentAvatar: "https://randomuser.me/api/portraits/men/5.jpg",
      subject: "Spanish Basics",
      requestedDate: "Dec 20, 2024",
      requestedTime: "10:00 AM - 11:00 AM",
      message: "I would like to focus on pronunciation and basic vocabulary.",
      studentLevel: "Beginner",
    },
    {
      id: 2,
      studentName: "Lisa Park",
      studentAvatar: "https://randomuser.me/api/portraits/women/6.jpg",
      subject: "Advanced Conversation",
      requestedDate: "Dec 21, 2024",
      requestedTime: "03:00 PM - 04:00 PM",
      message: "Looking to practice business Spanish for upcoming meetings.",
      studentLevel: "Advanced",
    },
    {
      id: 3,
      studentName: "David Miller",
      studentAvatar: "https://randomuser.me/api/portraits/men/7.jpg",
      subject: "Spanish Grammar",
      requestedDate: "Dec 22, 2024",
      requestedTime: "11:00 AM - 12:00 PM",
      message: "Need help with verb conjugations and tenses.",
      studentLevel: "Intermediate",
    },
  ];

  /**
   * Mock teaching materials
   * In production, fetch from /api/teachers/materials endpoint
   */
  const materials = [
    {
      id: 1,
      name: "Spanish Basics Guide.pdf",
      type: "PDF",
      size: "2.4 MB",
      downloads: 45,
      uploadDate: "2024-12-01",
    },
    {
      id: 2,
      name: "Vocabulary Flashcards.pptx",
      type: "PowerPoint",
      size: "5.1 MB",
      downloads: 32,
      uploadDate: "2024-11-28",
    },
    {
      id: 3,
      name: "Grammar Exercises.docx",
      type: "Word",
      size: "1.2 MB",
      downloads: 28,
      uploadDate: "2024-11-25",
    },
    {
      id: 4,
      name: "Pronunciation Audio.mp3",
      type: "Audio",
      size: "8.5 MB",
      downloads: 19,
      uploadDate: "2024-11-20",
    },
  ];

  /**
   * Mock student file submissions
   * In production, fetch from /api/teachers/submissions endpoint
   */
  const studentSubmissions = [
    {
      id: 1,
      studentName: "Emma Wilson",
      fileName: "Homework_Week5.pdf",
      submittedAt: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      studentName: "James Chen",
      fileName: "Essay_Draft.docx",
      submittedAt: "5 hours ago",
      status: "pending",
    },
    {
      id: 3,
      studentName: "Sophie Brown",
      fileName: "Practice_Exercises.pdf",
      submittedAt: "1 day ago",
      status: "reviewed",
    },
  ];

  /**
   * Mock earnings data
   * In production, fetch from /api/teachers/earnings endpoint
   */
  const earningsData = {
    thisMonth: 2450,
    lastMonth: 2180,
    pending: 350,
    available: 2100,
    recentTransactions: [
      {
        id: 1,
        studentName: "Emma Wilson",
        amount: 50,
        date: "Dec 15",
        status: "completed",
      },
      {
        id: 2,
        studentName: "James Chen",
        amount: 75,
        date: "Dec 14",
        status: "completed",
      },
      {
        id: 3,
        studentName: "Sophie Brown",
        amount: 50,
        date: "Dec 13",
        status: "pending",
      },
      {
        id: 4,
        studentName: "Michael Lee",
        amount: 100,
        date: "Dec 12",
        status: "completed",
      },
    ],
  };

  // ==================== LIFECYCLE HOOKS ====================

  /**
   * Effect: Fetch teacher data on component mount
   * Simulates API call with timeout
   */
  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchTeacherData = async () => {
    //   try {
    //     const response = await fetch('/api/teachers/me');
    //     const data = await response.json();
    //     setTeacher(data);
    //   } catch (error) {
    //     console.error('Failed to fetch teacher data:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // Simulated data loading
    setTimeout(() => {
      setTeacher({
        name: "Maria Garcia",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        subject: "Spanish Language",
        verified: true,
      });
      setLoading(false);
    }, 500);
  }, []);

  // ==================== EVENT HANDLERS ====================

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
   * Calendar-based availability settings
   */
  const renderAvailability = () => (
    <div className="availability-section">
      <div className="section-header">
        <h2>⏰ Manage Availability</h2>
        <button
          className="edit-availability-btn"
          onClick={() => setShowAvailabilityModal(true)}
        >
          Edit Schedule
        </button>
      </div>

      <div className="availability-grid">
        {[
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ].map((day) => (
          <div key={day} className="day-card">
            <h4>{day}</h4>
            <div className="time-slots">
              <span className="slot available">9:00 - 12:00</span>
              <span className="slot available">14:00 - 18:00</span>
            </div>
          </div>
        ))}
      </div>
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
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Teacher Dashboard</h1>
          <p className="welcome-text">
            Welcome back, {teacher?.name}! You have {stats.todayLessons} lessons
            today.
          </p>
        </div>
        <div className="header-right">
          <div className="teacher-profile-mini">
            <img
              src={teacher?.avatar}
              alt={teacher?.name}
              className="avatar-mini"
            />
            <div className="profile-info">
              <span className="name">{teacher?.name}</span>
              <span className="rating">
                ⭐ {stats.averageRating} ({stats.totalReviews} reviews)
              </span>
            </div>
          </div>
          <button
            className="header-btn settings-btn"
            onClick={() => navigate("/teacher-profile")}
          >
            ⚙️ Settings
          </button>
          <button className="header-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

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
              {renderSchedule()}
              {renderPendingBookings()}
              {renderAvailability()}
            </>
          )}

          {activeTab === "schedule" && renderSchedule()}

          {activeTab === "bookings" && renderPendingBookings()}

          {activeTab === "materials" && renderMaterials()}

          {activeTab === "earnings" && renderEarnings()}
        </div>
      </main>

      {/* Quick Actions Floating Button */}
      <div className="quick-actions-fab">
        <button className="fab-main" title="Quick Actions">
          +
        </button>
        <div className="fab-menu">
          <button title="Add Availability">⏰</button>
          <button title="Upload Material">📤</button>
          <button title="Send Message">💬</button>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
