import React, { useState, useEffect, useCallback } from "react";
import "./CalendarManager.css";

/**
 * CalendarManager Component
 *
 * Allows teachers to:
 * - Connect their Google Calendar
 * - Set availability slots
 * - View and manage their calendar events
 */
export default function CalendarManager() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: "",
    recurring: false,
    recurrenceType: "weekly",
  });

  // Check calendar connection status on mount
  useEffect(() => {
    checkConnectionStatus();

    // Check for callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("calendar") === "error") {
      alert("Failed to connect calendar: " + params.get("message"));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendar/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setIsConnected(data.connected);

      if (data.connected) {
        fetchEvents();
      }
    } catch (error) {
      console.error("Error checking calendar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendar/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendar/auth/url", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error getting auth URL:", error);
      alert("Failed to initiate calendar connection");
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect your Google Calendar?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch("/api/calendar/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsConnected(false);
      setEvents([]);
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      alert("Failed to disconnect calendar");
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();

    const startDateTime = `${newSlot.date}T${newSlot.startTime}:00`;
    const endDateTime = `${newSlot.date}T${newSlot.endTime}:00`;

    // Validate times
    if (new Date(startDateTime) >= new Date(endDateTime)) {
      alert("End time must be after start time");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const body = {
        startDateTime,
        endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Add recurrence if selected
      if (newSlot.recurring) {
        const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
        const dayOfWeek = days[new Date(newSlot.date).getDay()];

        if (newSlot.recurrenceType === "weekly") {
          body.recurring = true;
          body.recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${dayOfWeek};COUNT=12`;
        } else if (newSlot.recurrenceType === "daily") {
          body.recurring = true;
          body.recurrenceRule = "RRULE:FREQ=DAILY;COUNT=30";
        }
      }

      const response = await fetch("/api/calendar/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to create availability slot");
      }

      // Reset form and refresh events
      setNewSlot({
        date: "",
        startTime: "",
        endTime: "",
        recurring: false,
        recurrenceType: "weekly",
      });
      setShowAddSlot(false);
      fetchEvents();
    } catch (error) {
      console.error("Error adding availability:", error);
      alert("Failed to add availability slot");
    }
  };

  const handleDeleteEvent = async (eventId, eventType) => {
    const message =
      eventType === "availability"
        ? "Delete this availability slot?"
        : "Cancel this booked lesson?";

    if (!window.confirm(message)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const endpoint =
        eventType === "availability"
          ? `/api/calendar/availability/${eventId}`
          : `/api/calendar/cancel/${eventId}`;

      await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading) {
    return (
      <div className="calendar-manager">
        <div className="loading">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="calendar-manager">
      <div className="calendar-header">
        <h2>📅 Google Calendar Integration</h2>
        <p>Connect your Google Calendar to manage availability and bookings</p>
      </div>

      {!isConnected ? (
        <div className="connect-section">
          <div className="connect-card">
            <div className="connect-icon">📆</div>
            <h3>Connect Your Google Calendar</h3>
            <p>
              Students can only book you during times you've marked as
              available. Connect your calendar to start setting your
              availability.
            </p>
            <ul className="benefits-list">
              <li>✅ Automatic calendar sync</li>
              <li>✅ Google Meet links created automatically</li>
              <li>✅ Email reminders for both you and students</li>
              <li>✅ Easy availability management</li>
            </ul>
            <button className="connect-btn" onClick={handleConnect}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width="20"
              />
              Connect Google Calendar
            </button>
          </div>
        </div>
      ) : (
        <div className="calendar-content">
          <div className="connection-status">
            <span className="status-badge connected">✓ Calendar Connected</span>
            <button className="disconnect-btn" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>

          <div className="availability-section">
            <div className="section-header">
              <h3>Your Availability</h3>
              <button
                className="add-slot-btn"
                onClick={() => setShowAddSlot(!showAddSlot)}
              >
                {showAddSlot ? "Cancel" : "+ Add Availability"}
              </button>
            </div>

            {showAddSlot && (
              <form className="add-slot-form" onSubmit={handleAddAvailability}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newSlot.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, startTime: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newSlot.recurring}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, recurring: e.target.checked })
                      }
                    />
                    Repeat this slot
                  </label>

                  {newSlot.recurring && (
                    <select
                      value={newSlot.recurrenceType}
                      onChange={(e) =>
                        setNewSlot({
                          ...newSlot,
                          recurrenceType: e.target.value,
                        })
                      }
                    >
                      <option value="weekly">Weekly (12 weeks)</option>
                      <option value="daily">Daily (30 days)</option>
                    </select>
                  )}
                </div>

                <button type="submit" className="submit-btn">
                  Add Availability Slot
                </button>
              </form>
            )}

            <div className="events-list">
              <h4>Upcoming Events</h4>
              {events.length === 0 ? (
                <p className="no-events">
                  No upcoming events. Add availability slots for students to
                  book.
                </p>
              ) : (
                <div className="events-grid">
                  {events.map((event) => {
                    const start = formatDateTime(event.start);
                    const end = formatDateTime(event.end);

                    return (
                      <div
                        key={event.id}
                        className={`event-card ${event.type}`}
                      >
                        <div className="event-type-badge">
                          {event.type === "availability"
                            ? "🟢 Available"
                            : "🔵 Lesson"}
                        </div>
                        <div className="event-details">
                          <div className="event-title">{event.summary}</div>
                          <div className="event-time">
                            {start.date} • {start.time} - {end.time}
                          </div>
                          {event.meetingLink && (
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="meeting-link"
                            >
                              Join Meeting
                            </a>
                          )}
                        </div>
                        <button
                          className="delete-event-btn"
                          onClick={() =>
                            handleDeleteEvent(event.id, event.type)
                          }
                          title={
                            event.type === "availability"
                              ? "Delete slot"
                              : "Cancel lesson"
                          }
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
