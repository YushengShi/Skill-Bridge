import mongoose from "mongoose";

/**
 * ================================================================================
 * BOOKING MODEL
 * ================================================================================
 *
 * Represents a lesson booking between a student and teacher.
 * Tracks the full lifecycle: pending -> paid -> confirmed -> completed
 *
 * RELATIONSHIPS:
 * - teacherId: References the Teacher who will conduct the lesson
 * - studentId: References the Student who booked the lesson
 * ================================================================================
 */
const bookingSchema = new mongoose.Schema({
  // Reference to the teacher conducting this lesson
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },

  // Reference to the student who booked this lesson
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },

  // Type of lesson: 'trial' (discounted first lesson) or 'standard' (regular price)
  lessonType: String,

  // Price paid for this lesson in USD
  amount: Number,

  // Booking lifecycle status:
  // - 'pending': Awaiting teacher approval
  // - 'paid': Payment received, awaiting confirmation
  // - 'confirmed': Lesson scheduled and ready
  // - 'completed': Lesson has been conducted
  status: { type: String, default: "pending" },

  // Scheduled date for the lesson (date only, no time)
  scheduledDate: { type: Date },

  // Scheduled time in HH:MM format (e.g., "14:30")
  scheduledTime: { type: String },

  // Lesson duration in minutes (default: 60 minutes)
  duration: { type: Number, default: 60 },

  // Video call link for the online lesson (Zoom, Google Meet, etc.)
  meetingLink: { type: String },

  // Optional message from student when booking (learning goals, requests, etc.)
  message: { type: String },

  // Timestamp when booking was created
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
