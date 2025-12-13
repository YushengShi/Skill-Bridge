// api/webhook.js

import "dotenv/config";
import Stripe from "stripe";
import { Router } from "express";
import { google } from "googleapis";
import Booking from "../models/Booking.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Helper function to get authenticated Google Calendar client for a teacher
 */
async function getCalendarClient(teacherId) {
  const teacher = await Teacher.findById(teacherId).select(
    "googleCalendar timezone"
  );

  if (!teacher?.googleCalendar?.connected) {
    return null;
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

  return {
    calendar: google.calendar({ version: "v3", auth: authClient }),
    teacher,
  };
}

/**
 * Create calendar event for a booking
 */
async function createCalendarEvent(booking) {
  try {
    const result = await getCalendarClient(booking.teacherId);
    if (!result) {
      console.log("⚠️ Teacher calendar not connected, skipping event creation");
      return null;
    }

    const { calendar, teacher } = result;
    const student = await Student.findById(booking.studentId);

    if (!student) {
      console.log("⚠️ Student not found for booking");
      return null;
    }

    const event = {
      summary: `SkillBridge Lesson - ${student.firstName} ${student.lastName}`,
      description: `
Lesson Type: ${booking.lessonType || "Standard"}
Student: ${student.firstName} ${student.lastName}
Email: ${student.email}
Booking ID: ${booking._id}

This lesson was booked through SkillBridge.
      `.trim(),
      start: {
        dateTime: booking.startDateTime,
        timeZone: teacher.timezone || "UTC",
      },
      end: {
        dateTime: booking.endDateTime,
        timeZone: teacher.timezone || "UTC",
      },
      attendees: [{ email: student.email }, { email: teacher.email }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `skillbridge-${booking._id}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      colorId: "9",
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    return response.data;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     description: |
 *       Handles Stripe webhook events, particularly `checkout.session.completed`.
 *       Updates booking status to 'paid' when payment is successful.
 *
 *       **Note**: This endpoint requires raw body and Stripe signature verification.
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Webhook signature verification failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Webhook Error: Invalid signature"
 */
router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // 注意：这里必须是 raw body
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 处理 Checkout Session 完成事件
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // 🌟 核心修改：直接从 metadata 读取 ID，不需要正则，不需要再次请求 Stripe
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      console.log(`✅ Payment received for Booking ID: ${bookingId}`);

      try {
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { status: "paid" },
          { new: true }
        );

        if (updatedBooking) {
          console.log(
            `🎉 Database updated! Booking status: ${updatedBooking.status}`
          );

          // Create Google Calendar event for the booking
          if (updatedBooking.startDateTime && updatedBooking.endDateTime) {
            console.log("📅 Creating calendar event...");
            const calendarEvent = await createCalendarEvent(updatedBooking);

            if (calendarEvent) {
              // Update booking with calendar event info
              await Booking.findByIdAndUpdate(bookingId, {
                calendarEventId: calendarEvent.id,
                meetingLink:
                  calendarEvent.hangoutLink ||
                  calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
                status: "confirmed",
              });
              console.log(
                `📅 Calendar event created! Meeting link: ${calendarEvent.hangoutLink}`
              );
            }
          }
        } else {
          console.log(`⚠️ Booking not found for ID: ${bookingId}`);
        }
      } catch (dbError) {
        console.error("Database update failed:", dbError);
      }
    } else {
      console.log("⚠️ No bookingId found in session metadata.");
    }
  }

  res.status(200).json({ received: true });
});

export default router;
