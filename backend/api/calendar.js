import { Router } from "express";
import { google } from "googleapis";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import protect from "../middleware/auth.js";

const router = Router();

/**
 * ================================================================================
 * GOOGLE CALENDAR API ROUTES
 * ================================================================================
 *
 * Handles Google Calendar integration for:
 * - Teacher OAuth authentication with Google Calendar
 * - Teacher availability management via Google Calendar
 * - Student booking with calendar event creation
 *
 * FLOW:
 * 1. Teacher connects Google Calendar via OAuth
 * 2. Teacher sets availability in their calendar (creates "Available" events)
 * 3. Students see available slots when booking
 * 4. When student books, a calendar event is created for both parties
 * ================================================================================
 */

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/calendar/oauth/callback"
);

// Scopes required for calendar access
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/**
 * @swagger
 * /api/calendar/auth/url:
 *   get:
 *     summary: Get Google OAuth URL for calendar connection
 *     description: Returns the Google OAuth URL for teachers to connect their calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth URL generated successfully
 */
router.get("/auth/url", protect, async (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state: req.userId, // Pass user ID to callback
      prompt: "consent", // Force consent to get refresh token
    });

    res.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ message: "Failed to generate auth URL" });
  }
});

/**
 * @swagger
 * /api/calendar/oauth/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles the OAuth callback from Google and stores tokens
 *     tags: [Calendar]
 */
router.get("/oauth/callback", async (req, res) => {
  const { code, state: userId } = req.query;

  console.log("� OAuth callback received for user:", userId);

  if (!code) {
    console.log("❌ No authorization code received");
    return res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/teacher-dashboard?calendar=error&message=No authorization code`
    );
  }

  try {
    // Exchange code for tokens
    console.log("🔄 Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });

    // Store tokens in teacher's document
    const updateResult = await Teacher.findByIdAndUpdate(
      userId,
      {
        googleCalendar: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          connected: true,
          connectedAt: new Date(),
        },
      },
      { new: true }
    );

    if (updateResult) {
      console.log("✅ Calendar connected for teacher:", updateResult.name);
    } else {
      console.log("⚠️ Teacher not found with ID:", userId);
    }

    // Redirect back to frontend with success
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/teacher-dashboard?calendar=connected`
    );
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/teacher-dashboard?calendar=error&message=${encodeURIComponent(
        error.message
      )}`
    );
  }
});

/**
 * @swagger
 * /api/calendar/status:
 *   get:
 *     summary: Check Google Calendar connection status
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.get("/status", protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.userId).select("googleCalendar");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({
      connected: teacher.googleCalendar?.connected || false,
      connectedAt: teacher.googleCalendar?.connectedAt || null,
    });
  } catch (error) {
    console.error("Error checking calendar status:", error);
    res.status(500).json({ message: "Failed to check calendar status" });
  }
});

/**
 * @swagger
 * /api/calendar/disconnect:
 *   post:
 *     summary: Disconnect Google Calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.post("/disconnect", protect, async (req, res) => {
  try {
    await Teacher.findByIdAndUpdate(req.userId, {
      googleCalendar: {
        accessToken: null,
        refreshToken: null,
        expiryDate: null,
        connected: false,
        connectedAt: null,
      },
    });

    res.json({ message: "Calendar disconnected successfully" });
  } catch (error) {
    console.error("Error disconnecting calendar:", error);
    res.status(500).json({ message: "Failed to disconnect calendar" });
  }
});

/**
 * Helper function to get authenticated Google Calendar client for a teacher
 */
async function getCalendarClient(teacherId) {
  const teacher = await Teacher.findById(teacherId).select("googleCalendar");

  if (!teacher?.googleCalendar?.connected) {
    throw new Error("Google Calendar not connected");
  }

  const authClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  authClient.setCredentials({
    access_token: teacher.googleCalendar.accessToken,
    refresh_token: teacher.googleCalendar.refreshToken,
    expiry_date: teacher.googleCalendar.expiryDate,
  });

  // Handle token refresh
  authClient.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      await Teacher.findByIdAndUpdate(teacherId, {
        "googleCalendar.refreshToken": tokens.refresh_token,
      });
    }
    await Teacher.findByIdAndUpdate(teacherId, {
      "googleCalendar.accessToken": tokens.access_token,
      "googleCalendar.expiryDate": tokens.expiry_date,
    });
  });

  return google.calendar({ version: "v3", auth: authClient });
}

/**
 * @swagger
 * /api/calendar/availability:
 *   post:
 *     summary: Set teacher availability slot
 *     description: Creates an "Available" event in teacher's calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.post("/availability", protect, async (req, res) => {
  const { startDateTime, endDateTime, recurring, recurrenceRule } = req.body;

  if (!startDateTime || !endDateTime) {
    return res.status(400).json({ message: "Start and end time are required" });
  }

  try {
    const calendar = await getCalendarClient(req.userId);

    const event = {
      summary: "Available for Lessons",
      description: "SkillBridge - Available for booking",
      start: {
        dateTime: startDateTime,
        timeZone: req.body.timeZone || "UTC",
      },
      end: {
        dateTime: endDateTime,
        timeZone: req.body.timeZone || "UTC",
      },
      colorId: "2", // Green color for availability
      transparency: "transparent", // Show as available
    };

    // Add recurrence if specified
    if (recurring && recurrenceRule) {
      event.recurrence = [recurrenceRule];
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.json({
      message: "Availability slot created",
      eventId: response.data.id,
      event: response.data,
    });
  } catch (error) {
    console.error("Error creating availability:", error);
    res.status(500).json({
      message: "Failed to create availability slot",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/calendar/availability:
 *   get:
 *     summary: Get teacher's available slots
 *     description: Returns available time slots from teacher's calendar
 *     tags: [Calendar]
 */
router.get("/availability/:teacherId", async (req, res) => {
  const { teacherId } = req.params;
  const { startDate, endDate } = req.query;

  // Default to next 7 days if not specified
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate
    ? new Date(endDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const calendar = await getCalendarClient(teacherId);

    // Get all events in the time range
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    // Filter for availability slots (events with "Available for Lessons" title)
    const availableSlots = events
      .filter(
        (event) =>
          event.summary === "Available for Lessons" &&
          event.transparency === "transparent"
      )
      .map((event) => ({
        id: event.id,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        timeZone: event.start.timeZone,
      }));

    // Get booked slots to exclude from availability
    const bookedSlots = events
      .filter(
        (event) =>
          event.summary?.includes("SkillBridge Lesson") ||
          event.transparency === "opaque"
      )
      .map((event) => ({
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
      }));

    // Filter out booked times from available slots
    const finalAvailableSlots = availableSlots.filter((slot) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      // Check if any booked slot overlaps
      return !bookedSlots.some((booked) => {
        return slotStart < booked.end && slotEnd > booked.start;
      });
    });

    res.json({
      teacherId,
      availableSlots: finalAvailableSlots,
      bookedSlots: bookedSlots.length,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);

    // If calendar not connected, return empty availability
    if (error.message === "Google Calendar not connected") {
      return res.json({
        teacherId,
        availableSlots: [],
        calendarConnected: false,
        message: "Teacher has not connected their Google Calendar",
      });
    }

    res.status(500).json({
      message: "Failed to fetch availability",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/calendar/availability/:eventId:
 *   delete:
 *     summary: Delete an availability slot
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/availability/:eventId", protect, async (req, res) => {
  const { eventId } = req.params;

  try {
    const calendar = await getCalendarClient(req.userId);

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });

    res.json({ message: "Availability slot deleted" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({
      message: "Failed to delete availability slot",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/calendar/book:
 *   post:
 *     summary: Book a lesson and create calendar events
 *     description: Creates calendar events for both teacher and student
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.post("/book", protect, async (req, res) => {
  const { teacherId, bookingId, startDateTime, endDateTime, lessonType } =
    req.body;

  if (!teacherId || !startDateTime || !endDateTime) {
    return res.status(400).json({
      message: "Teacher ID, start time, and end time are required",
    });
  }

  try {
    // Get teacher and student info
    const [teacher, student] = await Promise.all([
      Teacher.findById(teacherId),
      Student.findById(req.userId),
    ]);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if teacher has calendar connected
    if (!teacher.googleCalendar?.connected) {
      return res.status(400).json({
        message: "Teacher has not connected their Google Calendar",
      });
    }

    const calendar = await getCalendarClient(teacherId);

    // Create the lesson event
    const event = {
      summary: `SkillBridge Lesson - ${student.firstName} ${student.lastName}`,
      description: `
Lesson Type: ${lessonType || "Standard"}
Student: ${student.firstName} ${student.lastName}
Email: ${student.email}

This lesson was booked through SkillBridge.
      `.trim(),
      start: {
        dateTime: startDateTime,
        timeZone: teacher.timezone || "UTC",
      },
      end: {
        dateTime: endDateTime,
        timeZone: teacher.timezone || "UTC",
      },
      attendees: [{ email: student.email }, { email: teacher.email }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 }, // 30 minutes before
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `skillbridge-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      colorId: "9", // Blue color for booked lessons
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1, // Enable Google Meet creation
      sendUpdates: "all", // Send invitations to attendees
    });

    const calendarEvent = response.data;

    // Update the booking with calendar event info
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        calendarEventId: calendarEvent.id,
        meetingLink:
          calendarEvent.hangoutLink ||
          calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
        scheduledDate: new Date(startDateTime),
        scheduledTime: new Date(startDateTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      });
    }

    res.json({
      message: "Lesson booked successfully",
      eventId: calendarEvent.id,
      meetingLink:
        calendarEvent.hangoutLink ||
        calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
      event: {
        id: calendarEvent.id,
        summary: calendarEvent.summary,
        start: calendarEvent.start,
        end: calendarEvent.end,
        meetingLink: calendarEvent.hangoutLink,
      },
    });
  } catch (error) {
    console.error("Error booking lesson:", error);
    res.status(500).json({
      message: "Failed to book lesson",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get teacher's calendar events
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.get("/events", protect, async (req, res) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate
    ? new Date(endDate)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  try {
    const calendar = await getCalendarClient(req.userId);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    // Categorize events
    const categorizedEvents = events.map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      type:
        event.summary === "Available for Lessons" ? "availability" : "lesson",
      meetingLink: event.hangoutLink,
      attendees: event.attendees?.map((a) => a.email) || [],
    }));

    res.json({ events: categorizedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      message: "Failed to fetch calendar events",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/calendar/cancel/:eventId:
 *   delete:
 *     summary: Cancel a booked lesson
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/cancel/:eventId", protect, async (req, res) => {
  const { eventId } = req.params;

  try {
    // Find the booking with this event ID
    const booking = await Booking.findOne({ calendarEventId: eventId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify the user is either the teacher or student
    const isTeacher = booking.teacherId.toString() === req.userId;
    const isStudent = booking.studentId.toString() === req.userId;

    if (!isTeacher && !isStudent) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    // Delete from calendar (use teacher's calendar)
    const calendar = await getCalendarClient(booking.teacherId);

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
      sendUpdates: "all", // Notify attendees
    });

    // Update booking status
    await Booking.findByIdAndUpdate(booking._id, {
      status: "cancelled",
      calendarEventId: null,
    });

    res.json({ message: "Lesson cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling lesson:", error);
    res.status(500).json({
      message: "Failed to cancel lesson",
      error: error.message,
    });
  }
});

export default router;
