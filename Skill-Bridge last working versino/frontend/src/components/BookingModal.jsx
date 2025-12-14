import React, { useState, useEffect } from "react";
import "../App.css";

export default function BookingModal({ teacher, onClose }) {
  const [lessonType, setLessonType] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate time slots (9 AM to 8 PM, every hour)
  const timeSlots = [];
  for (let hour = 9; hour <= 20; hour++) {
    const time12 = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
    const time24 = `${hour.toString().padStart(2, "0")}:00`;
    timeSlots.push({ display: time12, value: time24 });
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  const currentPrice =
    lessonType === "trial" ? teacher.prices.trial : teacher.prices.standard;

  const canProceed = lessonType && selectedDate && selectedTime;

  // Fetch booked slots when date is selected
  useEffect(() => {
    if (selectedDate && teacher._id) {
      setLoadingSlots(true);
      fetch(`/api/teachers/${teacher._id}/available-slots?date=${selectedDate}`)
        .then((res) => res.json())
        .then((data) => {
          setBookedSlots(data.bookedSlots || []);
        })
        .catch((err) => {
          console.error("Error fetching booked slots:", err);
          setBookedSlots([]);
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    } else {
      setBookedSlots([]);
    }
  }, [selectedDate, teacher._id]);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You need to be logged in to book a lesson.");
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/payment/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacherId: teacher._id,
          teacherName: teacher.name,
          lessonType: lessonType,
          price: currentPrice,
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
        }),
      });

      if (response.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initiation failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment failed", error);
      alert(error.message || "Something went wrong with payment initiation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book {teacher.name}</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: Lesson Type Selection */}
          <div className="booking-step">
            <h3>1. Choose Lesson Type</h3>
            <label
              className={`option-card ${
                lessonType === "trial" ? "selected" : ""
              }`}
              onClick={() => {
                setLessonType("trial");
                setSelectedTime(""); // Reset time when changing lesson type
              }}
            >
              <div>
                <strong>Trial Lesson (30 mins)</strong>
                <p>Good for first timers</p>
              </div>
              <div className="price">${teacher.prices.trial}</div>
            </label>

            <label
              className={`option-card ${
                lessonType === "standard" ? "selected" : ""
              }`}
              onClick={() => {
                setLessonType("standard");
                setSelectedTime(""); // Reset time when changing lesson type
              }}
            >
              <div>
                <strong>Standard Lesson (60 mins)</strong>
                <p>Regular structured lesson</p>
              </div>
              <div className="price">${teacher.prices.standard}</div>
            </label>
          </div>

          {/* Step 2: Date Selection (shown after lesson type is selected) */}
          {lessonType && (
            <div className="booking-step">
              <h3>2. Choose Date</h3>
              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime(""); // Reset time when changing date
                }}
                min={today}
                required
              />
            </div>
          )}

          {/* Step 3: Time Slot Selection (shown after date is selected) */}
          {lessonType && selectedDate && (
            <div className="booking-step">
              <h3>3. Choose Time Slot</h3>
              {loadingSlots ? (
                <p>Loading available slots...</p>
              ) : (
                <div className="time-slots-grid">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot.value);
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        className={`time-slot-btn ${
                          selectedTime === slot.value ? "selected" : ""
                        } ${isBooked ? "booked" : ""}`}
                        onClick={() => !isBooked && setSelectedTime(slot.value)}
                        disabled={isBooked}
                        title={isBooked ? "This time slot is already booked" : ""}
                      >
                        {slot.display}
                        {isBooked && " (Booked)"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="total">
            Total: <span>${currentPrice}</span>
          </div>
          <button
            className="confirm-btn"
            onClick={handlePayment}
            disabled={isLoading || !canProceed}
          >
            {isLoading
              ? "Loading..."
              : !canProceed
              ? "Select Date & Time"
              : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
