import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookingModal from "../components/BookingModal";
import "./TeacherProfile.css";

/**
 * TeacherProfile Component
 *
 * PURPOSE:
 * Displays a detailed public view of a teacher's profile for students to browse.
 * This is the page students see when they click "See Details" on a teacher card.
 *
 * FEATURES:
 * - Fetches teacher data from API using the teacher ID from URL params
 * - Displays teacher info: avatar, name, tagline, rating, lesson count
 * - Shows pricing for trial and standard lessons
 * - Tabbed interface for: About, Skills, Reviews, and Availability
 * - Book a Lesson button opens the BookingModal component
 * - Responsive design adapts to mobile screens
 *
 * ROUTE: /teachers/:id
 *
 * @component
 */
export default function TeacherProfile() {
  // Extract teacher ID from URL parameters (e.g., /teachers/abc123 -> id = "abc123")
  const { id } = useParams();

  // Navigation hook for programmatic routing (e.g., back to teachers list)
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================

  // Teacher data fetched from API - null until loaded
  const [teacher, setTeacher] = useState(null);

  // Loading state - true while fetching data from API
  const [loading, setLoading] = useState(true);

  // Error state - contains error message if API call fails
  const [error, setError] = useState(null);

  // Controls visibility of the booking modal popup
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Tracks which tab is currently active: "about" | "skills" | "reviews" | "availability"
  const [activeTab, setActiveTab] = useState("about");

  // ==================== DATA FETCHING ====================

  /**
   * Fetch teacher data when component mounts or when teacher ID changes.
   *
   * The useEffect hook with [id] dependency ensures:
   * - Data is fetched on initial component mount
   * - Data is re-fetched if user navigates to a different teacher profile
   *
   * Error Handling:
   * - If API returns non-OK status (404, 500, etc.), throws error
   * - Error is caught and stored in state for display
   * - Loading state is always set to false in finally block
   */
useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
           // navigate('/login'); 
           // return;
        }

        const response = await fetch(`/api/teachers/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            throw new Error("Please login to view teacher details");
        }

        if (!response.ok) {
          throw new Error("Teacher not found");
        }

        const data = await response.json();
        setTeacher(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]); // Re-run effect when teacher ID changes

  // Loading state
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading teacher profile...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/teachers")}>Back to Teachers</button>
      </div>
    );
  }

  // If no teacher found
  if (!teacher) {
    return (
      <div className="profile-error">
        <h2>Teacher Not Found</h2>
        <p>The teacher you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/teachers")}>Back to Teachers</button>
      </div>
    );
  }

  return (
    <div className="teacher-profile-container">
      {/* Header with back navigation */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate("/teachers")}>
          ← Back to Teachers
        </button>
      </header>

      {/* Main profile content */}
      <div className="profile-content">
        {/* Left sidebar with avatar and quick info */}
        <aside className="profile-sidebar">
          <div className="profile-card">
            <img
              src={teacher.avatar || "https://i.pravatar.cc/150?img=1"}
              alt={teacher.name}
              className="profile-avatar"
            />
            <h1 className="profile-name">{teacher.name}</h1>
            <span className="profile-tagline">{teacher.tagline}</span>

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">
                  ⭐ {teacher.rating?.toFixed(1) || "5.0"}
                </span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">{teacher.lessonCount || 0}</span>
                <span className="stat-label">Lessons</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {teacher.studentsCount || "50+"}
                </span>
                <span className="stat-label">Students</span>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="pricing-section">
              <h3>Lesson Pricing</h3>
              <div className="price-item">
                <span>Trial Lesson</span>
                <span className="price">${teacher.prices?.trial || 10}</span>
              </div>
              <div className="price-item">
                <span>Standard Lesson</span>
                <span className="price">${teacher.prices?.standard || 25}</span>
              </div>
            </div>

            <button
              className="book-btn-primary"
              onClick={() => setShowBookingModal(true)}
            >
              Book a Lesson
            </button>

            <button className="message-btn">Send Message</button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="profile-main">
          {/* Tabs navigation */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
            >
              About
            </button>
            <button
              className={`tab-btn ${activeTab === "skills" ? "active" : ""}`}
              onClick={() => setActiveTab("skills")}
            >
              Skills & Expertise
            </button>
            <button
              className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </button>
            <button
              className={`tab-btn ${
                activeTab === "availability" ? "active" : ""
              }`}
              onClick={() => setActiveTab("availability")}
            >
              Availability
            </button>
          </div>

          {/* Tab content */}
          <div className="tab-content">
            {activeTab === "about" && (
              <div className="about-section">
                <h2>About Me</h2>
                <p className="bio-text">
                  {teacher.bio || "This teacher has not added a bio yet."}
                </p>

                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-icon">🎓</span>
                    <div>
                      <h4>Education</h4>
                      <p>{teacher.education || "Bachelor's in Education"}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🌍</span>
                    <div>
                      <h4>Languages</h4>
                      <p>{teacher.languages?.join(", ") || "English"}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div>
                      <h4>Location</h4>
                      <p>{teacher.location || "Online"}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏰</span>
                    <div>
                      <h4>Response Time</h4>
                      <p>{teacher.responseTime || "Within 24 hours"}</p>
                    </div>
                  </div>
                </div>

                {/* Teaching Materials */}
                {teacher.materials && teacher.materials.length > 0 && (
                  <div className="materials-section">
                    <h3>Teaching Materials</h3>
                    <div className="materials-list">
                      {teacher.materials.map((material, index) => (
                        <div key={index} className="material-item">
                          <span className="material-icon">📄</span>
                          <span>{material.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="skills-section">
                <h2>Skills & Expertise</h2>
                <div className="skills-grid">
                  {(
                    teacher.skills || [
                      "English Grammar",
                      "Conversation",
                      "Business English",
                      "Test Preparation",
                    ]
                  ).map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <h3>Teaching Style</h3>
                <p>
                  {teacher.teachingStyle ||
                    "I believe in a student-centered approach where learning is interactive and engaging. My lessons are tailored to your specific needs and goals."}
                </p>

                <h3>Specializations</h3>
                <ul className="specialization-list">
                  {(
                    teacher.specializations || [
                      "Beginner to Advanced levels",
                      "Exam Preparation (IELTS, TOEFL)",
                      "Business Communication",
                      "Accent Reduction",
                    ]
                  ).map((spec, index) => (
                    <li key={index}>{spec}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="reviews-section">
                <h2>Student Reviews</h2>
                <div className="reviews-summary">
                  <div className="rating-big">
                    <span className="rating-number">
                      {teacher.rating?.toFixed(1) || "5.0"}
                    </span>
                    <span className="rating-stars">⭐⭐⭐⭐⭐</span>
                    <span className="rating-count">
                      Based on {teacher.reviewCount || 0} reviews
                    </span>
                  </div>
                </div>

                <div className="reviews-list">
                  {(
                    teacher.reviews || [
                      {
                        studentName: "Sarah M.",
                        rating: 5,
                        comment:
                          "Excellent teacher! Very patient and explains concepts clearly.",
                        date: "2024-01-15",
                      },
                      {
                        studentName: "John D.",
                        rating: 5,
                        comment: "Great lessons, highly recommend!",
                        date: "2024-01-10",
                      },
                    ]
                  ).map((review, index) => (
                    <div key={index} className="review-card">
                      <div className="review-header">
                        <span className="reviewer-name">
                          {review.studentName}
                        </span>
                        <span className="review-rating">
                          {"⭐".repeat(review.rating)}
                        </span>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <span className="review-date">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "availability" && (
              <div className="availability-section">
                <h2>Availability</h2>
                <p className="availability-note">
                  Select a time slot that works for you. All times are shown in
                  your local timezone.
                </p>

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
                    <div key={day} className="day-schedule">
                      <h4>{day}</h4>
                      <div className="time-slots">
                        {teacher.availability?.[day.toLowerCase()] ? (
                          teacher.availability[day.toLowerCase()].map(
                            (slot, index) => (
                              <span key={index} className="time-slot">
                                {slot}
                              </span>
                            )
                          )
                        ) : (
                          <>
                            <span className="time-slot">9:00 AM</span>
                            <span className="time-slot">2:00 PM</span>
                            <span className="time-slot">6:00 PM</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="book-btn-primary"
                  onClick={() => setShowBookingModal(true)}
                >
                  Book a Lesson Now
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          teacher={teacher}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}
