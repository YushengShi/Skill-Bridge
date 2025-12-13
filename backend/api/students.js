import { Router } from "express";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Booking from "../models/Booking.js";
import protect from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

// JWT secret - in production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * ================================================================================
 * STUDENT API ROUTES
 * ================================================================================
 *
 * Base URL: /api/students
 *
 * These routes handle all student profile operations including:
 * - CRUD operations for student profiles
 * - Profile lookup by email (for authentication)
 * - Notification preference updates
 *
 * SECURITY NOTES:
 * - Password field is always excluded from responses using .select("-password")
 * - In production, add authentication middleware to protect routes
 * - Email uniqueness is enforced at database level
 *
 * TODO: Add authentication middleware to protect routes
 * TODO: Add authorization to ensure users can only modify their own profiles
 * ================================================================================
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     description: Fetches all students from the database. Intended for admin use only. Passwords are excluded from response.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
router.get("/", protect, async (req, res) => {
  try {
    // .select("-password") excludes the password field from results
    const students = await Student.find().select("-password");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Register a new student
 *     description: Creates a new student account. Used during registration process.
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentRegistration'
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         description: Validation error or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req, res) => {
  const { email } = req.body;

  try {
    if (email) {
      const existingTeacher = await Teacher.findOne({ email });
      if (existingTeacher) {
        return res.status(400).json({
          message:
            "This email is registered as a Teacher. Accounts cannot be both.",
        });
      }
    }

    const student = new Student({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role: "student",
      notifications: req.body.notifications,
    });

    const newStudent = await student.save();
    const studentResponse = newStudent.toObject();
    delete studentResponse.password;

    res.status(201).json(studentResponse);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email already exists as a Student" });
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students/my-bookings:
 *   get:
 *     summary: Get current student's bookings
 *     description: Fetches all bookings for the authenticated student, populated with teacher info.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
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
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const currentStudentId = req.userId;

    const bookings = await Booking.find({ studentId: currentStudentId })
      .populate("teacherId", "name avatar email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     description: Fetches a single student by their MongoDB ObjectId.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the student
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Student found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Student not found
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
router.get("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-password");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    // Invalid ObjectId format (not 24-char hex string)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update student profile
 *     description: Updates an existing student's profile. Only allows updating specific fields. Students can only update their own profile.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the student
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *               learningGoals:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *               timezone:
 *                 type: string
 *               skillLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               notifications:
 *                 type: string
 *                 description: JSON string of notification preferences
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       403:
 *         description: Not authorized to update this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Student not found
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
router.put("/:id", protect, upload.single("avatar"), async (req, res) => {
  if (req.userId !== req.params.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  try {
    let notifications = req.body.notifications;
    if (typeof notifications === "string") {
      try {
        notifications = JSON.parse(notifications);
      } catch (e) {
        console.error("JSON Parse Error:", e);
      }
    }

    const updateFields = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      bio: req.body.bio,
      learningGoals: req.body.learningGoals,
      preferredLanguage: req.body.preferredLanguage,
      timezone: req.body.timezone,
      skillLevel: req.body.skillLevel,
      notifications: notifications,
    };

    if (req.file) {
      const cleanPath = req.file.filename.replace(/\\/g, "/");
      updateFields.avatar = `http://localhost:3000/uploads/${cleanPath}`;
    }

    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete student account
 *     description: Permanently deletes a student account. This action is irreversible.
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the student
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       404:
 *         description: Student not found
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
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students/login:
 *   post:
 *     summary: Student login
 *     description: Authenticates a student and returns a JWT token.
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials or inactive account
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

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const student = await Student.findOne({
      email: email.toLowerCase().trim(),
    });
    if (!student) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (student.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!student.isActive) {
      return res.status(401).json({ message: "Account is inactive" });
    }

    const token = jwt.sign(
      {
        id: student._id,
        email: student.email,
        role: "student",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.json({
      token,
      user: studentResponse,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students/email/{email}:
 *   get:
 *     summary: Get student by email
 *     description: Fetches a student by their email address. Useful for authentication flows.
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Student's email address
 *         example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Student found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
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
router.get("/email/:email", async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email }).select(
      "-password"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students/{id}/notifications:
 *   patch:
 *     summary: Update notification preferences
 *     description: Updates only the notification preferences for a student.
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *                 example: true
 *               sms:
 *                 type: boolean
 *                 example: false
 *               bookingReminders:
 *                 type: boolean
 *                 example: true
 *               promotions:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Notifications updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/:id/notifications", async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { notifications: req.body },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    ).select("-password");

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/students/{id}/dashboard:
 *   get:
 *     summary: Get student dashboard data
 *     description: Fetches all dashboard data for a student including stats, upcoming lessons, recent activity, and recommended teachers.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the student
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentDashboard'
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

    const studentId = req.params.id;

    // Get all bookings for this student
    const allBookings = await Booking.find({ studentId }).populate("teacherId");

    // Calculate stats
    const now = new Date();
    const upcomingBookings = allBookings.filter(
      (b) => b.status === "confirmed" && new Date(b.scheduledDate) >= now
    );
    const completedBookings = allBookings.filter(
      (b) => b.status === "completed"
    );

    // Calculate total hours (assuming 1 hour per lesson for now, or use duration if available)
    const totalHours = completedBookings.reduce(
      (sum, b) => sum + (b.duration || 60) / 60,
      0
    );

    // Get unique teachers the student has worked with
    const teacherIds = [
      ...new Set(
        allBookings.map((b) => b.teacherId?._id?.toString()).filter(Boolean)
      ),
    ];

    const stats = {
      upcomingLessons: upcomingBookings.length,
      completedLessons: completedBookings.length,
      totalHours: Math.round(totalHours),
      teachersWorkedWith: teacherIds.length,
    };

    // Format upcoming lessons
    const upcomingLessons = upcomingBookings
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .slice(0, 5)
      .map((booking) => ({
        id: booking._id,
        teacherName: booking.teacherId?.name || "Unknown Teacher",
        teacherAvatar: booking.teacherId?.avatar || "https://i.pravatar.cc/150",
        subject: booking.lessonType || "General Lesson",
        date: booking.scheduledDate,
        time: booking.scheduledTime || "TBD",
        duration: booking.duration || 60,
        status: booking.status,
        meetingLink: booking.meetingLink || null,
      }));

    // Get recent activity from bookings (last 10 activities)
    const recentBookings = allBookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentActivity = recentBookings.map((booking) => {
      let type, message, icon;

      if (booking.status === "completed") {
        type = "lesson_completed";
        message = `Completed lesson with ${
          booking.teacherId?.name || "a teacher"
        }`;
        icon = "✅";
      } else if (booking.status === "confirmed") {
        type = "booking_confirmed";
        message = `Booking confirmed for ${booking.lessonType || "lesson"}`;
        icon = "📅";
      } else if (booking.status === "paid") {
        type = "payment_success";
        message = `Payment of $${booking.amount || 0} processed`;
        icon = "💳";
      } else {
        type = "booking_pending";
        message = `New booking pending with ${
          booking.teacherId?.name || "a teacher"
        }`;
        icon = "⏳";
      }

      return {
        id: booking._id,
        type,
        message,
        icon,
        time: getRelativeTime(booking.createdAt),
      };
    });

    // Get recommended teachers (teachers not yet worked with, or top-rated)
    const recommendedTeachers = await Teacher.find({
      _id: { $nin: teacherIds },
      isApproved: { $ne: false },
    })
      .sort({ rating: -1 })
      .limit(3)
      .select("name avatar tagline rating prices");

    const formattedRecommendedTeachers = recommendedTeachers.map((teacher) => ({
      id: teacher._id,
      name: teacher.name,
      avatar: teacher.avatar || "https://i.pravatar.cc/150",
      subject: teacher.tagline || "General Tutor",
      rating: teacher.rating || 5.0,
      price: teacher.prices?.standard || 25,
    }));

    // Fetch the student's learning progress for skill tracking visualization
    // Returns array of { subject, progress } objects for the progress bars
    const student = await Student.findById(studentId).select(
      "learningProgress"
    );
    const learningProgress = student?.learningProgress || [];

    // Return all dashboard data in a single response to minimize API calls
    res.json({
      stats, // Summary statistics for the stat cards
      upcomingLessons, // Next 5 scheduled lessons
      recentActivity, // Last 5 booking activities
      recommendedTeachers: formattedRecommendedTeachers, // AI-like teacher suggestions
      learningProgress, // Subject progress for visualization
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Converts a timestamp to a human-readable relative time string.
 * Used for displaying "2 hours ago", "1 day ago", etc. in activity feeds.
 *
 * @param {Date|string} date - The date to convert
 * @returns {string} Human-readable relative time (e.g., "5 minutes ago")
 */
function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date); // Difference in milliseconds
  const minutes = Math.floor(diff / 60000); // Convert to minutes
  const hours = Math.floor(diff / 3600000); // Convert to hours
  const days = Math.floor(diff / 86400000); // Convert to days

  // Return the most appropriate time unit
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default router;
