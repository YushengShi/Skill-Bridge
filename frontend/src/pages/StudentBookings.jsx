import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_AVATAR } from "../constants";
import "./StudentBookings.css";

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("/api/students/my-bookings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data = await response.json();

        // 🌟 核心修改：只过滤出 'paid' 和 'completed' 的订单
        const activeBookings = data.filter(
          (booking) =>
            booking.status === "paid" || booking.status === "completed"
        );

        setBookings(activeBookings);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return <span className="status-badge success">Paid</span>;
      case "completed":
        return <span className="status-badge info">Completed</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading)
    return (
      <div className="bookings-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your schedule...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bookings-page">
        <div className="error-container">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );

  return (
    <div className="bookings-page">
      <header className="page-header">
        <h1>My Lessons</h1>
        <button onClick={() => navigate("/teacherhome")} className="back-btn">
          Book New Lesson
        </button>
      </header>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h2>No upcoming lessons</h2>
          <p>You don't have any paid or active lessons currently.</p>
          <button
            onClick={() => navigate("/teacherhome")}
            className="primary-btn"
          >
            Find a Teacher
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <div className="teacher-info">
                  <img
                    src={booking.teacherId?.avatar || DEFAULT_AVATAR}
                    alt="Teacher"
                    className="teacher-avatar-small"
                  />
                  <div>
                    <h3>{booking.teacherId?.name || "Unknown Teacher"}</h3>
                    <span className="lesson-type">
                      {booking.lessonType.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="booking-price">${booking.amount}</div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="detail-row hide-on-mobile">
                  <span className="label">Booking ID:</span>
                  <span className="id-text">{booking._id.slice(-6)}</span>
                </div>
                <div className="detail-row hide-on-mobile">
                  <span className="label">Contact:</span>
                  <span className="value">
                    {booking.teacherId?.email || "N/A"}
                  </span>
                </div>
              </div>

              <div className="booking-footer">
                <div className="status-container">
                  {getStatusBadge(booking.status)}
                </div>

                <div className="action-buttons">
                  <button className="join-btn">Join Room</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
