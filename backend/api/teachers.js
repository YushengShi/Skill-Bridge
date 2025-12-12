import { Router } from "express";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import jwt from "jsonwebtoken";
import protect from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt";

const router = Router();

/**
 * ================================================================================
 * TEACHER API ROUTES
 * ================================================================================
 *
 * Base URL: /api/teachers
 *
 * These routes handle all teacher-related operations including:
 * - Fetching teacher listings for the browse page
 * - Getting individual teacher profiles
 * - Creating new teacher profiles
 * - Seeding the database with mock data for development
 *
 * IMPORTANT: Route order matters in Express!
 * Static routes (e.g., /seed) must come BEFORE dynamic routes (e.g., /:id)
 * Otherwise, "seed" would be interpreted as an ID parameter.
 * ================================================================================
 */

/**
 * GET /api/teachers
 *
 * Fetches all teachers from the database.
 * Used on the teacher discovery/browse page.
 *
 * @returns {Array} List of all teacher documents
 * @returns {Object} 500 error if database query fails
 */
router.get("/", async (req, res) => {
  try {
    const teachers = await Teacher.find().select("-password");
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/teachers/seed
 *
 * Development utility route to populate the database with mock teachers.
 * WARNING: This deletes ALL existing teachers before inserting new ones!
 *
 * NOTE: This route MUST be defined before /:id route, otherwise
 * Express will interpret "seed" as a teacher ID.
 *
 * @returns {Object} Success message confirming seed operation
 * @returns {Object} 500 error if database operation fails
 */
router.get("/seed", async (req, res) => {
  const mockTeachers = [
    {
      name: "English Teacher Roz",
      tagline: "Professional Teacher",
      bio: "I am extremely patient and I love working with beginners.",
      avatar: "https://i.pravatar.cc/150?img=5",
      rating: 5.0,
      lessonCount: 1377,
      prices: { trial: 8, standard: 24 },
    },
    {
      name: "Paul Interview Coach",
      tagline: "Business & Interview Expert",
      bio: "Expert in job interview preparation and business English.",
      avatar: "https://i.pravatar.cc/150?img=11",
      rating: 4.9,
      lessonCount: 850,
      prices: { trial: 10, standard: 30 },
    },
  ];

  try {
    await Teacher.deleteMany({});
    await Teacher.insertMany(mockTeachers);
    res.json({ msg: "✅ Teachers seeded successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/teachers/:id  → Fetch one teacher by ID
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




router.post('/', async (req, res) => {

/**
 * POST /api/teachers
 *
 * Creates a new teacher profile.
 * Used when a new teacher registers or admin creates a teacher account.
 *
 * Required fields in request body:
 * - name: Teacher's full name
 * - tagline: Short professional title (e.g., "Professional Teacher")
 * - bio: Description of teaching experience and style
 * - avatar: URL to profile image
 * - prices: Object with trial and standard lesson prices
 *
 * Optional fields (have defaults):
 * - rating: Defaults to 5.0
 * - lessonCount: Defaults to 0
 *
 * @param {Object} req.body - Teacher data
 * @returns {Object} 201 with created teacher document
 * @returns {Object} 400 if validation fails
 */
router.post("/", async (req, res) => {

  const teacher = new Teacher({
    name: req.body.name,
    tagline: req.body.tagline,
    bio: req.body.bio,
    avatar: req.body.avatar,
    rating: req.body.rating || 5.0,
    lessonCount: req.body.lessonCount || 0,
    prices: {
      trial: req.body.prices.trial,
      standard: req.body.prices.standard,
    },
  });

  try {
    const newTeacher = await teacher.save();
    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * GET /api/teachers/:id
 *
 * Fetches a single teacher by their MongoDB ObjectId.
 * Used on the teacher profile detail page.
 *
 * IMPORTANT: This route must come AFTER all static routes (/seed, etc.)
 * to prevent route conflicts.
 *
 * Error Handling:
 * - Returns 404 if teacher not found
 * - Returns 404 if ID format is invalid (not a valid ObjectId)
 * - Returns 500 for other database errors
 *
 * @param {string} req.params.id - MongoDB ObjectId of the teacher
 * @returns {Object} Teacher document if found
 * @returns {Object} 404 if not found or invalid ID
 * @returns {Object} 500 for database errors
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select("-password");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (error) {
    if (error.kind === "ObjectId")
      return res.status(404).json({ message: "Teacher not found" });
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/teachers/register
 * Public: Teacher Registration
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res
        .status(400)
        .json({ message: "Email already exists as a Teacher" });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        message:
          "This email is registered as a Student. Accounts cannot be both.",
      });
    }

    const teacher = new Teacher({
      name,
      email,
      password,
      role: "teacher",
      prices: { trial: 15, standard: 30 },
    });

    await teacher.save();

    res.status(201).json({ message: "Teacher registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/**
 * POST /api/teachers/login
 * Public: Teacher Login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (teacher.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: teacher._id, email: teacher.email, role: "teacher" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const teacherData = teacher.toObject();
    delete teacherData.password;

    res.json({ token, user: teacherData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/teachers/:id/dashboard
 *
 * Fetches all dashboard data for a teacher:
 * - Stats (total students, pending bookings, today's lessons, monthly earnings)
 * - Today's schedule
 * - Pending booking requests
 * - Recent earnings/transactions
 *
 * @param {string} req.params.id - MongoDB ObjectId of the teacher
 * @returns {Object} Dashboard data object
 */
router.get("/:id/dashboard", protect, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this dashboard" });
    }

    const teacherId = req.params.id;

    // Get teacher data
    const teacher = await Teacher.findById(teacherId).select("-password");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get all bookings for this teacher
    const allBookings = await Booking.find({ teacherId }).populate("studentId");

    // Calculate stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's lessons
    const todayBookings = allBookings.filter((b) => {
      const bookingDate = new Date(b.scheduledDate);
      return (
        b.status === "confirmed" &&
        bookingDate >= today &&
        bookingDate < tomorrow
      );
    });

    // Pending bookings
    const pendingBookings = allBookings.filter((b) => b.status === "pending");

    // This month's earnings (from paid/confirmed/completed bookings)
    const monthlyBookings = allBookings.filter((b) => {
      return (
        ["paid", "confirmed", "completed"].includes(b.status) &&
        new Date(b.createdAt) >= monthStart
      );
    });
    const monthlyEarnings = monthlyBookings.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    );

    // Unique students
    const uniqueStudentIds = [
      ...new Set(
        allBookings.map((b) => b.studentId?._id?.toString()).filter(Boolean)
      ),
    ];

    const stats = {
      totalStudents: uniqueStudentIds.length,
      pendingBookings: pendingBookings.length,
      todayLessons: todayBookings.length,
      monthlyEarnings,
      averageRating: teacher.rating || 5.0,
      totalReviews: teacher.reviewCount || 0,
    };

    // Format today's schedule
    const todaySchedule = todayBookings
      .sort((a, b) => {
        const timeA = a.scheduledTime || "00:00";
        const timeB = b.scheduledTime || "00:00";
        return timeA.localeCompare(timeB);
      })
      .map((booking) => {
        const endTime = calculateEndTime(
          booking.scheduledTime,
          booking.duration || 60
        );
        return {
          id: booking._id,
          studentName: booking.studentId?.firstName
            ? `${booking.studentId.firstName} ${
                booking.studentId.lastName || ""
              }`
            : "Unknown Student",
          studentAvatar:
            booking.studentId?.avatar ||
            "https://randomuser.me/api/portraits/lego/1.jpg",
          subject: booking.lessonType || "General Lesson",
          time: `${booking.scheduledTime || "TBD"} - ${endTime}`,
          status: isLessonInProgress(booking.scheduledTime, booking.duration)
            ? "in-progress"
            : "upcoming",
          meetingLink: booking.meetingLink || "https://meet.example.com/lesson",
        };
      });

    // Format pending booking requests
    const formattedPendingBookings = pendingBookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((booking) => ({
        id: booking._id,
        studentName: booking.studentId?.firstName
          ? `${booking.studentId.firstName} ${booking.studentId.lastName || ""}`
          : "Unknown Student",
        studentAvatar:
          booking.studentId?.avatar ||
          "https://randomuser.me/api/portraits/lego/1.jpg",
        subject: booking.lessonType || "General Lesson",
        requestedDate: formatDate(booking.scheduledDate),
        requestedTime: booking.scheduledTime || "TBD",
        message: booking.message || "No message provided",
        studentLevel: booking.studentId?.skillLevel || "Not specified",
      }));

    // Recent transactions (paid bookings)
    const paidBookings = allBookings
      .filter((b) => ["paid", "confirmed", "completed"].includes(b.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const earningsData = {
      thisMonth: monthlyEarnings,
      lastMonth: 0, // Would need to calculate from previous month
      pending: pendingBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
      available: monthlyEarnings, // Simplified - would need payment tracking
      recentTransactions: paidBookings.map((booking) => ({
        id: booking._id,
        studentName: booking.studentId?.firstName
          ? `${booking.studentId.firstName} ${booking.studentId.lastName || ""}`
          : "Unknown Student",
        amount: booking.amount || 0,
        date: formatShortDate(booking.createdAt),
        status: booking.status === "completed" ? "completed" : "pending",
      })),
    };

    res.json({
      teacher: {
        name: teacher.name,
        avatar: teacher.avatar,
        subject: teacher.tagline,
        verified: teacher.isApproved,
      },
      stats,
      todaySchedule,
      pendingBookings: formattedPendingBookings,
      earningsData,
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculates the end time of a lesson given start time and duration.
 * Used to display time ranges like "9:00 AM - 10:00 AM" in schedules.
 *
 * @param {string} startTime - Start time in "HH:MM" 24-hour format
 * @param {number} durationMinutes - Lesson duration in minutes
 * @returns {string} Formatted end time with AM/PM (e.g., "10:00 AM")
 */
function calculateEndTime(startTime, durationMinutes) {
  if (!startTime) return "TBD";

  // Parse hours and minutes from "HH:MM" format
  const [hours, minutes] = startTime.split(":").map(Number);

  // Calculate total minutes and derive end time
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24; // Wrap at 24 hours
  const endMins = totalMinutes % 60;

  // Format as 12-hour time with AM/PM
  const period = endHours >= 12 ? "PM" : "AM";
  const displayHours = endHours % 12 || 12; // Convert 0 to 12 for midnight
  return `${displayHours}:${endMins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Checks if a lesson is currently in progress based on start time and duration.
 * Used to highlight active lessons in the schedule with "Live" status.
 *
 * @param {string} startTime - Start time in "HH:MM" 24-hour format
 * @param {number} durationMinutes - Lesson duration in minutes
 * @returns {boolean} True if the lesson is currently happening
 */
function isLessonInProgress(startTime, durationMinutes) {
  if (!startTime) return false;

  const now = new Date();

  // Create Date objects for lesson start and end times (today)
  const [hours, minutes] = startTime.split(":").map(Number);
  const lessonStart = new Date();
  lessonStart.setHours(hours, minutes, 0, 0);
  const lessonEnd = new Date(lessonStart.getTime() + durationMinutes * 60000);

  // Check if current time falls within lesson window
  return now >= lessonStart && now <= lessonEnd;
}

/**
 * Formats a date as a readable string (e.g., "Dec 20, 2024").
 * Used for displaying booking request dates.
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date as a short string (e.g., "Dec 20").
 * Used for transaction dates in earnings history.
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Short formatted date string
 */
function formatShortDate(date) {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default router;
