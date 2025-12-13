import React, { useState, useEffect } from "react";
import "../App.css";

export default function BookingModal({ teacher, onClose }) {
  const [lessonType, setLessonType] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [bookedSlots, setBookedSlots] = useState([]);

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
  const lessonDuration = lessonType === "trial" ? 30 : 60;

  // Fetch available slots when component mounts or date changes
  useEffect(() => {
    fetchAvailableSlots();
  }, [teacher._id, selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const startDate = selectedDate || new Date().toISOString().split("T")[0];
      const endDate = new Date(
        new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

      const response = await fetch(
        `/api/calendar/availability/${teacher._id}?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (data.calendarConnected === false) {
        setCalendarConnected(false);
        setAvailableSlots([]);
      } else {
        setCalendarConnected(true);
        // Process slots to generate bookable time slots
        const processedSlots = processAvailabilitySlots(
          data.availableSlots || [],
          lessonDuration
        );
        setAvailableSlots(processedSlots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Process availability slots into bookable time slots
  const processAvailabilitySlots = (slots, duration) => {
    const bookableSlots = [];

    slots.forEach((slot) => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      let current = new Date(start);

      // Generate slots of the specified duration
      while (current.getTime() + duration * 60 * 1000 <= end.getTime()) {
        // Skip slots in the past
        if (current > new Date()) {
          bookableSlots.push({
            id: slot.id,
            start: new Date(current).toISOString(),
            end: new Date(
              current.getTime() + duration * 60 * 1000
            ).toISOString(),
          });
        }
        current = new Date(current.getTime() + duration * 60 * 1000);
      }
    });

    // Sort by date/time
    return bookableSlots.sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  // Re-process slots when lesson type changes
  useEffect(() => {
    if (availableSlots.length > 0) {
      fetchAvailableSlots();
    }
    setSelectedSlot(null);
  }, [lessonType]);

  const formatSlotDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatSlotTime = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Group slots by date
  const groupSlotsByDate = (slots) => {
    const grouped = {};
    slots.forEach((slot) => {
      const dateKey = new Date(slot.start).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    return grouped;
  };

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

    if (!selectedSlot) {
      alert("Please select a time slot for your lesson.");
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
          scheduledDate: selectedSlot.start,
          scheduledTime: new Date(selectedSlot.start).toLocaleTimeString(
            "en-US",
            { hour: "2-digit", minute: "2-digit", hour12: false }
          ),
          startDateTime: selectedSlot.start,
          endDateTime: selectedSlot.end,
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

  const groupedSlots = groupSlotsByDate(availableSlots);

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

          {/* Time Slot Selection */}
          <div className="time-slots-section">
            <h3>🕐 Select a Time Slot</h3>

            {!calendarConnected ? (
              <div className="no-calendar-warning">
                <p>⚠️ This teacher hasn't set up their availability yet.</p>
                <p>Please check back later or contact them directly.</p>
              </div>
            ) : loadingSlots ? (
              <div className="loading-slots">Loading available times...</div>
            ) : availableSlots.length === 0 ? (
              <div className="no-slots">
                <p>No available slots for the selected period.</p>
                <p>Try selecting a different date.</p>
              </div>
            ) : (
              <div className="slots-container">
                {Object.entries(groupedSlots).map(([dateKey, slots]) => (
                  <div key={dateKey} className="date-group">
                    <div className="date-header">
                      {formatSlotDate(slots[0].start)}
                    </div>
                    <div className="time-slots">
                      {slots.map((slot, index) => (
                        <button
                          key={`${slot.id}-${index}`}
                          className={`time-slot ${
                            selectedSlot?.start === slot.start ? "selected" : ""
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatSlotTime(slot.start, slot.end)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="selected-slot-summary">
              <strong>Selected:</strong> {formatSlotDate(selectedSlot.start)} at{" "}
              {formatSlotTime(selectedSlot.start, selectedSlot.end)}
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
            disabled={isLoading || !selectedSlot || !calendarConnected}
          >
            {isLoading
              ? "Loading..."
              : !calendarConnected
              ? "Not Available"
              : !selectedSlot
              ? "Select a Time Slot"
              : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
