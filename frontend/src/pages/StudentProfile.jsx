import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentProfile.css";

/**
 * StudentProfile Component
 *
 * PURPOSE:
 * Provides a dashboard for students to view and manage their profile.
 * This is a protected route - only accessible when authenticated.
 *
 * FEATURES:
 * - Personal Info Tab: View/edit profile details (name, email, bio, etc.)
 * - My Bookings Tab: View upcoming, completed, and cancelled lesson bookings
 * - Uploaded Files Tab: Manage homework/assignment submissions with teacher feedback
 * - Settings Tab: Configure notification preferences and account settings
 *
 * STATE MANAGEMENT:
 * - Uses local state for profile data (will integrate with API)
 * - Form supports edit mode with save/cancel functionality
 * - File uploads handled via ref to hidden file input
 *
 * ROUTE: /profile (protected - requires authentication)
 *
 * @component
 * @param {Object} props
 * @param {Function} props.setIsAuthenticated - Callback to update auth state on logout
 */
export default function StudentProfile({ setIsAuthenticated }) {
  // Navigation hook for redirecting after logout or to other pages
  const navigate = useNavigate();

  // Ref to hidden file input for avatar upload (triggered programmatically)
  const fileInputRef = useRef(null);

  // ==================== UI STATE ====================

  // Currently active navigation tab: "profile" | "bookings" | "files" | "settings"
  const [activeTab, setActiveTab] = useState("profile");

  // Edit mode toggle - when true, form fields become editable
  const [isEditing, setIsEditing] = useState(false);

  // Loading state for async operations (e.g., saving profile)
  const [loading, setLoading] = useState(false);

  // Success message visibility - auto-hides after 3 seconds
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ==================== PROFILE DATA STATE ====================

  /**
   * Student profile data structure.
   * Initialized with defaults, populated from API on mount.
   *
   * Fields:
   * - firstName, lastName: User's name
   * - email: Account email (usually not editable)
   * - phone: Contact number
   * - avatar: Profile picture URL
   * - bio: Short description about the student
   * - learningGoals: What the student wants to achieve
   * - preferredLanguage: Language preference for lessons
   * - timezone: User's timezone (auto-detected from browser)
   * - skillLevel: Current proficiency level
   * - notifications: Object containing notification preferences
   */
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    learningGoals: "",
    preferredLanguage: "English",
    // Auto-detect user's timezone from browser settings
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    skillLevel: "beginner",
    notifications: {
      email: true,
      sms: false,
      bookingReminders: true,
      promotions: false,
    },
  });

  // ==================== BOOKINGS DATA ====================

  /**
   * Student's lesson bookings.
   * TODO: Fetch from /api/bookings endpoint
   *
   * Booking Status Types:
   * - "upcoming": Future lessons that can be cancelled/rescheduled
   * - "completed": Past lessons (can leave review)
   * - "cancelled": Cancelled by student or teacher
   *
   * Each booking contains:
   * - id: Unique identifier
   * - teacherName, teacherAvatar: Teacher info
   * - date, time, duration: When and how long
   * - type: "Trial Lesson" or "Standard Lesson"
   * - status: Current booking status
   * - price: Amount paid/to be paid
   */
  const [bookings, setBookings] = useState([
    {
      id: 1,
      teacherName: "English Teacher Roz",
      teacherAvatar: "https://i.pravatar.cc/150?img=5",
      date: "2024-12-15",
      time: "10:00 AM",
      duration: 60,
      type: "Standard Lesson",
      status: "upcoming",
      price: 24,
    },
    {
      id: 2,
      teacherName: "Paul Interview Coach",
      teacherAvatar: "https://i.pravatar.cc/150?img=11",
      date: "2024-12-10",
      time: "2:00 PM",
      duration: 30,
      type: "Trial Lesson",
      status: "completed",
      price: 10,
    },
  ]);

  // ==================== UPLOADED FILES DATA ====================

  /**
   * Student's uploaded homework/assignment files.
   * TODO: Fetch from /api/files endpoint
   *
   * File Status Types:
   * - "pending": Uploaded, waiting for teacher review
   * - "reviewed": Teacher has provided feedback
   *
   * Each file contains:
   * - id: Unique identifier
   * - name: Original filename
   * - type: MIME type (application/pdf, image/*, etc.)
   * - size: File size in human-readable format
   * - uploadDate: When the file was uploaded
   * - teacherName: Which teacher the file is for
   * - status: Review status
   * - feedback: Teacher's comments (null if not yet reviewed)
   */
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: "Homework_Week1.pdf",
      type: "application/pdf",
      size: "2.4 MB",
      uploadDate: "2024-12-05",
      teacherName: "English Teacher Roz",
      status: "reviewed",
      feedback: "Great work! Keep practicing your grammar.",
    },
    {
      id: 2,
      name: "Essay_Draft.docx",
      type: "application/docx",
      size: "1.1 MB",
      uploadDate: "2024-12-08",
      teacherName: "Paul Interview Coach",
      status: "pending",
      feedback: null,
    },
  ]);

  // Load profile data
  useEffect(() => {
    const fetchProfileData = () => {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        console.error("No user data found in local storage.");
        // Optionally navigate to login if no user is found
        navigate("/login");
        return;
      }

      try {
        const user = JSON.parse(userStr);

        // Set the profile state with the data from localStorage
        // Provide default values for fields that might be missing
        setProfile({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          avatar:
            user.avatar ||
            "https://i.pravatar.cc/150?u=" + (user._id || user.id),
          bio: user.bio || "",
          learningGoals: user.learningGoals || "",
          preferredLanguage: user.preferredLanguage || "English",
          timezone:
            user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          skillLevel: user.skillLevel || "beginner",
          notifications: {
            email: user.notifications?.email ?? true,
            sms: user.notifications?.sms ?? false,
            bookingReminders: user.notifications?.bookingReminders ?? true,
            promotions: user.notifications?.promotions ?? false,
          },
        });
      } catch (error) {
        console.error("Failed to parse user data from local storage:", error);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // ==================== EVENT HANDLERS ====================

  /**
   * Handles all form input changes (text, select, checkbox).
   *
   * Special handling for nested notification preferences:
   * - If field name starts with "notifications.", updates nested object
   * - Example: name="notifications.email" updates profile.notifications.email
   *
   * For checkboxes, uses 'checked' property instead of 'value'.
   *
   * @param {Event} e - The input change event
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested notification preferences (e.g., "notifications.email")
    if (name.startsWith("notifications.")) {
      const notifKey = name.split(".")[1]; // Extract key after "notifications."
      setProfile((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notifKey]: checked, // Notifications are always checkboxes
        },
      }));
    } else {
      // Handle regular form fields
      setProfile((prev) => ({
        ...prev,
        // Use 'checked' for checkboxes, 'value' for other inputs
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  /**
   * Triggers the hidden file input when avatar is clicked.
   * Only works when in edit mode to prevent accidental uploads.
   */
  const handleAvatarClick = () => {
    if (isEditing) {
      // Programmatically click the hidden file input
      fileInputRef.current?.click();
    }
  };

  /**
   * Handles avatar image file selection.
   * Creates a temporary preview URL using createObjectURL.
   * TODO: Upload the actual file to server/cloud storage.
   *
   * @param {Event} e - The file input change event
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. 生成预览图 (仅用于前端显示，不发给后端)
      const previewUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, avatar: previewUrl }));
      
      // 2. 保存原始文件对象 (发送给后端用)
      setSelectedFile(file);
    }
  };

  /**
   * Saves the updated profile to the server.
   * Shows success message for 3 seconds after successful save.
   * TODO: Replace mock delay with actual API call to PUT /api/students/:id
   */
  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        navigate("/login");
        return;
      }
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;

      // 1. 创建 FormData 对象
      const formData = new FormData();

      // 2. 追加普通字段
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("bio", profile.bio);
      formData.append("learningGoals", profile.learningGoals);
      formData.append("preferredLanguage", profile.preferredLanguage);
      formData.append("timezone", profile.timezone);
      formData.append("skillLevel", profile.skillLevel);

      // 3. 追加复杂对象 (必须转成字符串)
      formData.append("notifications", JSON.stringify(profile.notifications));

      // 4. 追加文件 (如果有新上传的文件)
      // 注意：'avatar' 这个名字必须跟后端 upload.single('avatar') 里的名字一致
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const response = await fetch(`http://localhost:3000/api/students/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser)); 

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancels edit mode and reverts changes.
   * TODO: Reset profile state to original fetched data.
   */
  const handleCancel = () => {
    setIsEditing(false);
    // TODO: Reset profile to original data fetched from API
    // setProfile(originalProfile);
  };

  /**
   * Handles homework/assignment file uploads.
   * Creates a new file entry in the uploadedFiles list.
   * TODO: Upload actual file to server storage.
   *
   * @param {Event} e - The file input change event
   */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create file metadata object
      const newFile = {
        id: Date.now(), // Temporary ID until server assigns real one
        name: file.name,
        type: file.type,
        // Convert bytes to MB with one decimal place
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split("T")[0],
        teacherName: "Pending Assignment", // Will be assigned when selecting teacher
        status: "pending",
        feedback: null,
      };
      // Add new file to beginning of list (most recent first)
      setUploadedFiles((prev) => [newFile, ...prev]);
      // TODO: Upload file to server using FormData
    }
  };

  /**
   * Cancels an upcoming booking after user confirmation.
   * Updates local state immediately (optimistic update).
   * TODO: Call API to actually cancel the booking.
   *
   * @param {string|number} bookingId - The ID of the booking to cancel
   */
  const handleCancelBooking = (bookingId) => {
    // Show confirmation dialog to prevent accidental cancellations
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      // Optimistically update UI - change status to cancelled
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
      // TODO: Call API to cancel booking:
      // await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    }
  };

  /**
   * Logs out the user and redirects to login page.
   * Clears authentication state and localStorage token.
   */
  const handleLogout = () => {
    // Update parent component's auth state if callback provided
    if (setIsAuthenticated) {
      setIsAuthenticated(false);
    }
    // Clear persisted auth state and JWT token
    localStorage.removeItem("isAuth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="student-profile-container">
      {/* Header */}
      <header className="student-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/teachers")}>
            ← Back
          </button>
          <h1>My Profile</h1>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Success Message */}
      {saveSuccess && (
        <div className="success-banner">✓ Profile saved successfully!</div>
      )}

      {/* Main Content */}
      <div className="student-profile-content">
        {/* Sidebar Navigation */}
        <aside className="profile-nav">
          <div className="nav-avatar-section">
            <div
              className={`nav-avatar-wrapper ${isEditing ? "editable" : ""}`}
              onClick={handleAvatarClick}
            >
              <img src={profile.avatar} alt="Profile" className="nav-avatar" />
              {isEditing && (
                <div className="avatar-overlay">
                  <span>📷</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            <h3>
              {profile.firstName} {profile.lastName}
            </h3>
            <p>{profile.email}</p>
          </div>

          <nav className="nav-menu">
            <button
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <span className="nav-icon">👤</span>
              Personal Info
            </button>
            <button
              className={`nav-item ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <span className="nav-icon">📅</span>
              My Bookings
            </button>
            <button
              className={`nav-item ${activeTab === "files" ? "active" : ""}`}
              onClick={() => setActiveTab("files")}
            >
              <span className="nav-icon">📁</span>
              Uploaded Files
            </button>
            <button
              className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className="nav-icon">⚙️</span>
              Settings
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="profile-main-content">
          {/* Personal Info Tab */}
          {activeTab === "profile" && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Personal Information</h2>
                {!isEditing ? (
                  <button
                    className="edit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="cancel-btn" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button
                      className="save-btn"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              <form className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      // onChange={handleChange}
                      disabled={true}
                      style={{ cursor: "not-allowed", opacity: 0.7 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Tell teachers a bit about yourself..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Learning Goals</label>
                  <textarea
                    name="learningGoals"
                    value={profile.learningGoals}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={2}
                    placeholder="What do you want to achieve?"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Skill Level</label>
                    <select
                      name="skillLevel"
                      value={profile.skillLevel}
                      onChange={handleChange}
                      disabled={!isEditing}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="fluent">Fluent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      name="timezone"
                      value={profile.timezone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    >
                      <option value="America/New_York">
                        Eastern Time (ET)
                      </option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">
                        Pacific Time (PT)
                      </option>
                      <option value="Europe/London">GMT/BST</option>
                      <option value="Europe/Paris">
                        Central European Time
                      </option>
                      <option value="Asia/Tokyo">Japan Standard Time</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="bookings-section">
              <div className="section-header">
                <h2>My Bookings</h2>
                <button
                  className="new-booking-btn"
                  onClick={() => navigate("/teachers")}
                >
                  + Book New Lesson
                </button>
              </div>

              <div className="bookings-filter">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Upcoming</button>
                <button className="filter-btn">Completed</button>
                <button className="filter-btn">Cancelled</button>
              </div>

              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`booking-card ${booking.status}`}
                  >
                    <div className="booking-left">
                      <img
                        src={booking.teacherAvatar}
                        alt={booking.teacherName}
                        className="booking-avatar"
                      />
                      <div className="booking-info">
                        <h4>{booking.teacherName}</h4>
                        <p className="booking-type">{booking.type}</p>
                        <p className="booking-datetime">
                          📅{" "}
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {booking.time}
                        </p>
                        <p className="booking-duration">
                          ⏱ {booking.duration} minutes
                        </p>
                      </div>
                    </div>
                    <div className="booking-right">
                      <span className={`booking-status ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                      <span className="booking-price">${booking.price}</span>
                      {booking.status === "upcoming" && (
                        <div className="booking-actions">
                          <button className="reschedule-btn">Reschedule</button>
                          <button
                            className="cancel-booking-btn"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {booking.status === "completed" && (
                        <button className="review-btn">Leave Review</button>
                      )}
                    </div>
                  </div>
                ))}

                {bookings.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <h3>No bookings yet</h3>
                    <p>Start learning by booking a lesson with a teacher.</p>
                    <button onClick={() => navigate("/teachers")}>
                      Find a Teacher
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="files-section">
              <div className="section-header">
                <h2>Uploaded Files</h2>
                <label className="upload-btn">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                  />
                  📤 Upload File
                </label>
              </div>

              <p className="files-description">
                Upload homework, assignments, or documents for your teachers to
                review.
              </p>

              <div className="files-list">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="file-card">
                    <div className="file-icon">
                      {file.type.includes("pdf")
                        ? "📄"
                        : file.type.includes("image")
                        ? "🖼️"
                        : "📝"}
                    </div>
                    <div className="file-info">
                      <h4>{file.name}</h4>
                      <p className="file-meta">
                        {file.size} • Uploaded{" "}
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                      <p className="file-teacher">For: {file.teacherName}</p>
                    </div>
                    <div className="file-status">
                      <span className={`status-badge ${file.status}`}>
                        {file.status === "reviewed"
                          ? "✓ Reviewed"
                          : "⏳ Pending Review"}
                      </span>
                    </div>
                    {file.feedback && (
                      <div className="file-feedback">
                        <strong>Feedback:</strong> {file.feedback}
                      </div>
                    )}
                  </div>
                ))}

                {uploadedFiles.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">📁</span>
                    <h3>No files uploaded</h3>
                    <p>
                      Upload your homework or assignments for teacher feedback.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Settings</h2>
              </div>

              <div className="settings-group">
                <h3>Notification Preferences</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span>Email Notifications</span>
                    <p>Receive updates about your bookings via email</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={profile.notifications.email}
                      onChange={handleChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span>SMS Notifications</span>
                    <p>Receive text messages for important updates</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      name="notifications.sms"
                      checked={profile.notifications.sms}
                      onChange={handleChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span>Booking Reminders</span>
                    <p>Get reminded before your scheduled lessons</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      name="notifications.bookingReminders"
                      checked={profile.notifications.bookingReminders}
                      onChange={handleChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span>Promotional Emails</span>
                    <p>Receive offers and updates about new features</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      name="notifications.promotions"
                      checked={profile.notifications.promotions}
                      onChange={handleChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <h3>Account</h3>
                <div className="setting-item clickable">
                  <div className="setting-info">
                    <span>Change Password</span>
                    <p>Update your account password</p>
                  </div>
                  <span className="arrow">→</span>
                </div>
                <div className="setting-item clickable danger">
                  <div className="setting-info">
                    <span>Delete Account</span>
                    <p>Permanently delete your account and data</p>
                  </div>
                  <span className="arrow">→</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
