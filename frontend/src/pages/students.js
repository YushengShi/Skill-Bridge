import { Router } from "express";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import Teacher from "../models/Teacher.js";
import protect from "../middleware/auth.js";

const router = Router();

/**
 * ================================================================================
 * STUDENT API ROUTES
 * ================================================================================
 *
 * Base URL: /api/students
 *
 * These routes handle all student-related operations including:
 * - Creating new student profiles (registration)
 * - Updating student profiles
 * - Fetching student dashboard data
 *
 * ================================================================================
 */

/**
 * POST /api/students
 * Public: Student Registration
 */
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists (as student or teacher)
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Email already exists as a Student" });
    }
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        message:
          "This email is registered as a Teacher. Accounts cannot be both.",
      });
    }

    const student = new Student({
      firstName,
      lastName,
      email,
      password, // In a real app, this should be hashed
      role: "student",
    });

    await student.save();

    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/students/:id
 * Protected: Update a student's profile
 */
router.put("/:id", protect, async (req, res) => {
  try {
    // Ensure the logged-in user is only updating their own profile
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find the student by ID and update with the request body
    // { new: true } returns the updated document
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password from the response

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

/**
 * GET /api/students/:id/dashboard
 *
 * Fetches all dashboard data for a student:
 * - Stats (upcoming lessons, completed lessons, total hours)
 * - Upcoming lessons
 * - Recent activity
 * - Recommended teachers
 * - Learning progress
 *
 * @param {string} req.params.id - MongoDB ObjectId of the student
 * @returns {Object} Dashboard data object
 */
router.get("/:id/dashboard", protect, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this dashboard" });
    }

    const studentId = req.params.id;

    // Get all bookings for this student
    const allBookings = await Booking.find({ studentId }).populate("teacherId");

    // Calculate stats
    const now = new Date();
    const upcomingBookings = allBookings.filter(
      (b) => new Date(b.scheduledDate) >= now && b.status === "confirmed"
    );
    const completedBookings = allBookings.filter(
      (b) => b.status === "completed"
    );
    const totalHours =
      completedBookings.reduce((sum, b) => sum + (b.duration || 0), 0) / 60;
    const uniqueTeacherIds = [
      ...new Set(
        allBookings.map((b) => b.teacherId?._id?.toString()).filter(Boolean)
      ),
    ];

    const stats = {
      upcomingLessons: upcomingBookings.length,
      completedLessons: completedBookings.length,
      totalHours: Math.round(totalHours),
      teachersWorkedWith: uniqueTeacherIds.length,
    };

    // Format upcoming lessons
    const upcomingLessons = upcomingBookings
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .slice(0, 3) // Limit to 3 for the dashboard
      .map((b) => ({
        id: b._id,
        teacherName: b.teacherId?.name || "N/A",
        teacherAvatar:
          b.teacherId?.avatar || "https://i.pravatar.cc/150?img=1",
        subject: b.lessonType || "Lesson",
        date: b.scheduledDate,
        time: b.scheduledTime,
        duration: b.duration,
        status: b.status,
        meetingLink: b.meetingLink,
      }));

    // Mock data for other sections until their APIs are built
    const recentActivity = [
      {
        id: 1,
        icon: "💳",
        message: "You booked a trial lesson with English Teacher Roz.",
        time: "2 days ago",
      },
    ];
    const recommendedTeachers = await Teacher.find().limit(3); // Simple recommendation
    const learningProgress = [
      { subject: "Conversational English", progress: 75 },
      { subject: "Business Vocabulary", progress: 40 },
    ];

    res.json({
      stats,
      upcomingLessons,
      recentActivity,
      recommendedTeachers: recommendedTeachers.map((t) => ({
        id: t._id,
        name: t.name,
        avatar: t.avatar,
        subject: t.tagline,
        rating: t.rating,
        price: t.prices.standard,
      })),
      learningProgress,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;