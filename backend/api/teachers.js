import { Router } from "express";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Booking from "../models/Booking.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

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
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Get all teachers
 *     description: Fetches all teachers from the database. Used on the teacher discovery/browse page.
 *     tags: [Teachers]
 *     responses:
 *       200:
 *         description: List of all teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Teacher'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/teachers/seed:
 *   get:
 *     summary: Seed database with mock teachers
 *     description: |
 *       Development utility route to populate the database with mock teachers.
 *       **WARNING**: This deletes ALL existing teachers before inserting new ones!
 *     tags: [Teachers]
 *     responses:
 *       200:
 *         description: Teachers seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "✅ Teachers seeded successfully!"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     description: Fetches a single teacher by their MongoDB ObjectId. Used on the teacher profile detail page.
 *     tags: [Teachers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the teacher
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Teacher found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/teachers/:id  → Fetch one teacher by ID
router.get("/:id", async (req, res) => {
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

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Create a new teacher
 *     description: Creates a new teacher profile with basic information.
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               tagline:
 *                 type: string
 *                 example: "Professional English Teacher"
 *               bio:
 *                 type: string
 *                 example: "10+ years of teaching experience"
 *               avatar:
 *                 type: string
 *                 example: "https://i.pravatar.cc/150?img=5"
 *               rating:
 *                 type: number
 *                 example: 5.0
 *               lessonCount:
 *                 type: integer
 *                 example: 0
 *               prices:
 *                 type: object
 *                 properties:
 *                   trial:
 *                     type: number
 *                     example: 10
 *                   standard:
 *                     type: number
 *                     example: 25
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/teachers/register:
 *   post:
 *     summary: Register a new teacher
 *     description: Public endpoint for teacher registration. Creates a new teacher account with email and password.
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherRegistration'
 *     responses:
 *       201:
 *         description: Teacher registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
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
 * @swagger
 * /api/teachers/login:
 *   post:
 *     summary: Teacher login
 *     description: Authenticates a teacher and returns a JWT token.
 *     tags: [Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (teacher.isBanned) {
      return res.status(403).json({ 
          message: "Your account has been banned. Please contact support." 
      });
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
 * @swagger
 * /api/teachers/{id}/dashboard:
 *   get:
 *     summary: Get teacher dashboard data
 *     description: |
 *       Fetches all dashboard data for a teacher including:
 *       - Stats (total students, pending bookings, today's lessons, monthly earnings)
 *       - Today's schedule
 *       - Pending booking requests
 *       - Recent earnings/transactions
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the teacher
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherDashboard'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to access this dashboard
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    // Today's lessons - check if scheduledDate is today
    // Include both confirmed and paid bookings for today
    const todayBookings = allBookings.filter((b) => {
      if (!b.scheduledDate) return false;
      
      // Get today's date string in YYYY-MM-DD format using UTC
      // This matches how dates are stored (UTC midnight)
      const todayYear = now.getUTCFullYear();
      const todayMonth = now.getUTCMonth() + 1;
      const todayDay = now.getUTCDate();
      const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      
      // Get booking date string in YYYY-MM-DD format using UTC
      // Since dates are stored as UTC midnight, use UTC components for comparison
      const bookingDate = new Date(b.scheduledDate);
      const bookingYear = bookingDate.getUTCFullYear();
      const bookingMonth = bookingDate.getUTCMonth() + 1;
      const bookingDay = bookingDate.getUTCDate();
      const bookingStr = `${bookingYear}-${String(bookingMonth).padStart(2, '0')}-${String(bookingDay).padStart(2, '0')}`;
      
      const isToday = bookingStr === todayStr;
        
      return (
        ["confirmed", "paid"].includes(b.status) &&
        isToday
      );
    });

    // Pending bookings (for stats)
    const pendingBookings = allBookings.filter((b) => b.status === "pending");

    // Upcoming appointments - all confirmed/paid bookings (students who signed up)
    // Show all students who have booked lessons, regardless of date
    const upcomingAppointments = allBookings.filter((b) => {
      return ["confirmed", "paid"].includes(b.status);
    });

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
          time: booking.scheduledTime 
            ? `${formatTime12Hour(booking.scheduledTime)} - ${endTime}`
            : "TBD",
          status: isLessonInProgress(booking.scheduledTime, booking.duration)
            ? "in-progress"
            : "upcoming",
          meetingLink: booking.meetingLink || "https://meet.example.com/lesson",
        };
      });

    // Format upcoming appointments - include date and time for each booking
    const formattedUpcomingAppointments = upcomingAppointments
      .filter((booking) => booking.scheduledDate) // Only include bookings with dates
      .sort((a, b) => {
        // Sort by date, then by time
        const dateA = new Date(a.scheduledDate);
        const dateB = new Date(b.scheduledDate);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
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
            ? `${booking.studentId.firstName} ${booking.studentId.lastName || ""}`
            : "Unknown Student",
          studentAvatar:
            booking.studentId?.avatar ||
            "https://randomuser.me/api/portraits/lego/1.jpg",
          studentLevel: booking.studentId?.skillLevel || "Not specified",
          subject: booking.lessonType || "General Lesson",
          status: booking.status,
          scheduledDate: formatDate(booking.scheduledDate),
          scheduledTime: booking.scheduledTime 
            ? `${formatTime12Hour(booking.scheduledTime)} - ${endTime}`
            : "TBD",
        };
      });

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
      pendingBookings: formattedUpcomingAppointments, // Now contains upcoming appointments
      earningsData,
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Formats a 24-hour time string to 12-hour format with AM/PM
 * @param {string} time24 - Time in "HH:MM" 24-hour format
 * @returns {string} Formatted time with AM/PM (e.g., "9:00 AM")
 */
function formatTime12Hour(time24) {
  if (!time24) return "TBD";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

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
 * Handles timezone correctly by using UTC date components.
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return "TBD";
  const d = new Date(date);
  
  // Use UTC date methods since dates are stored as UTC midnight
  // This ensures "2024-12-13" displays as "Dec 13, 2024" regardless of server timezone
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  
  return `${month} ${day}, ${year}`;
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

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update teacher profile
 *     description: Updates a teacher's profile. Teachers can only update their own profile.
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the teacher
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               tagline:
 *                 type: string
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               education:
 *                 type: string
 *               teachingStyle:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               prices:
 *                 type: string
 *                 description: JSON string of prices object
 *               availability:
 *                 type: string
 *                 description: JSON string of availability object
 *               skills:
 *                 type: string
 *                 description: JSON string of skills array
 *               languages:
 *                 type: string
 *                 description: JSON string of languages array
 *               specializations:
 *                 type: string
 *                 description: JSON string of specializations array
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this profile" });
    }

    const parseJSON = (data) => {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        return data;
      }
    };

    const updateData = {
      name: req.body.name,
      phone: req.body.phone,
      tagline: req.body.tagline,
      bio: req.body.bio,
      location: req.body.location,
      education: req.body.education,
      teachingStyle: req.body.teachingStyle,
      videoUrl: req.body.videoUrl,

      prices: parseJSON(req.body.prices),
      availability: parseJSON(req.body.availability),
      skills: parseJSON(req.body.skills),
      languages: parseJSON(req.body.languages),
      specializations: parseJSON(req.body.specializations),
    };

    if (req.file) {
      const cleanPath = req.file.filename.replace(/\\/g, "/");
      updateData.avatar = `http://localhost:3000/uploads/${cleanPath}`;
    }

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(updatedTeacher);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * POST /api/teachers/:teacherId/rate
 * 
 * Submits a rating and review for a teacher after a completed booking.
 * 
 * Required fields:
 * - bookingId: The booking ID that was completed
 * - rating: Number between 1 and 5
 * - comment: Optional review comment
 * 
 * @param {string} req.params.teacherId - MongoDB ObjectId of the teacher
 * @param {Object} req.body - Rating data { bookingId, rating, comment }
 * @returns {Object} Success message and updated teacher data
 * @returns {Object} 400 if validation fails
 * @returns {Object} 404 if teacher or booking not found
 * @returns {Object} 403 if booking doesn't belong to student
 */
/**
 * GET /api/teachers/:teacherId/available-slots
 * 
 * Gets available time slots for a specific date.
 * Returns time slots that are already booked (to prevent double booking).
 * 
 * @param {string} req.params.teacherId - MongoDB ObjectId of the teacher
 * @param {string} req.query.date - Date in YYYY-MM-DD format
 * @returns {Object} Array of booked time slots for the date
 */
router.get("/:teacherId/available-slots", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Find all bookings for this teacher on the specified date
    // Parse date string "YYYY-MM-DD" and create UTC date range
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const bookings = await Booking.find({
      teacherId,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["pending", "paid", "confirmed"] }, // Include all active bookings
    });

    // Extract booked time slots
    const bookedSlots = bookings
      .map((booking) => booking.scheduledTime)
      .filter(Boolean);

    res.json({ bookedSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/:teacherId/rate", protect, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { bookingId, rating, comment } = req.body;
    const studentId = req.userId; // From JWT token

    // Validate input
    if (!bookingId || !rating) {
      return res.status(400).json({ 
        message: "Booking ID and rating are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify booking belongs to the student and teacher
    if (booking.studentId.toString() !== studentId) {
      return res.status(403).json({ 
        message: "You can only rate bookings you made" 
      });
    }

    if (booking.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        message: "Booking does not match this teacher" 
      });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({ 
        message: "You can only rate completed bookings" 
      });
    }

    // Find teacher and student
    const teacher = await Teacher.findById(teacherId);
    const student = await Student.findById(studentId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student already rated this booking
    const existingReview = teacher.reviews.find(
      (review) => review.bookingId && review.bookingId.toString() === bookingId
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment || existingReview.comment;
      existingReview.date = new Date();
    } else {
      // Add new review
      teacher.reviews.push({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        bookingId: booking._id,
        rating: rating,
        comment: comment || "",
        date: new Date(),
      });
    }

    // Recalculate teacher's average rating
    teacher.calculateRating();
    await teacher.save();

    res.json({
      message: "Rating submitted successfully",
      teacher: {
        rating: teacher.rating,
        reviewCount: teacher.reviewCount,
      },
    });
  } catch (error) {
    console.error("Rating submission error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
