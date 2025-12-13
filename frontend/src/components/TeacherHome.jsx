import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../constants";
import BookingModal from "./BookingModal";
import "../App.css";

const NotificationModal = ({ type, message, onClose, onConfirm }) => {
  const isSuccess = type === "success";

  const handleClick = () => {
    onClose(); // Close the modal
    if (isSuccess && onConfirm) {
      onConfirm(); // Navigate to my-bookings
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content notification-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`status-icon ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? "✓" : "✕"}
        </div>
        <h2>{isSuccess ? "Booking Confirmed!" : "Booking Canceled"}</h2>
        <p>{message}</p>
        <button
          className="confirm-btn"
          onClick={handleClick}
          style={{ marginTop: "20px", width: "100%" }}
        >
          {isSuccess ? "View My Bookings" : "Close"}
        </button>
      </div>
    </div>
  );
};

export default function TeacherHome({ setIsAuthenticated }) {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [notification, setNotification] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/teachers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          throw new Error("Session expired");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTeachers(data);
        } else {
          console.error("API did not return an array:", data);
        }
      })
      .catch((err) => console.error("Error fetching teachers:", err));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);

    if (query.get("success")) {
      setNotification({
        type: "success",
        message: "Your payment was successful. The teacher has been notified!",
      });
      navigate("/teachers", { replace: true });
    }

    if (query.get("canceled")) {
      setNotification({
        type: "error",
        message:
          "You canceled the payment. Feel free to book whenever you are ready.",
      });
      navigate("/teachers", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>
          Find your <span>teacher</span> online
        </h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="teacher-list">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <div key={teacher._id} className="teacher-card">
              <div className="card-left">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="avatar"
                />
                <div className="info">
                  <h3>{teacher.name}</h3>
                  <span className="tag">{teacher.tagline}</span>
                  <div className="stats">
                    ⭐ {teacher.rating} • {teacher.lessonCount} lessons
                  </div>
                  <p className="bio">{teacher.bio}</p>
                </div>
              </div>

              <div className="card-right">
                <div className="price-box">
                  <span className="label">Trial Price</span>
                  <span className="price">${teacher.prices.trial}</span>
                </div>
                <div className="btn-group">
                  <button
                    className="details-btn"
                    onClick={() => navigate(`/teachers/${teacher._id}`)}
                  >
                    See Details
                  </button>
                  <button
                    className="book-btn"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    Book Trial
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-teachers">Loading teachers...</p>
        )}
      </div>

      {selectedTeacher && (
        <BookingModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}

      {notification && (
        <NotificationModal
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          onConfirm={() => navigate("/my-bookings")}
        />
      )}
    </div>
  );
}
