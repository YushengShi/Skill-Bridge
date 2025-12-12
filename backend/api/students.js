import { Router } from "express";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

const router = Router();

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

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
 * GET /api/students
 *
 * Fetches all students from the database.
 * Intended for admin use only - should be protected.
 *
 * NOTE: Passwords are excluded from response for security.
 *
 * @returns {Array} List of all student documents (without passwords)
 * @returns {Object} 500 error if database query fails
 */
router.get("/", async (req, res) => {
  try {
    // .select("-password") excludes the password field from results
    const students = await Student.find().select("-password");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/students/:id
 *
 * Fetches a single student by their MongoDB ObjectId.
 * Used to load profile data on the student profile page.
 *
 * @param {string} req.params.id - MongoDB ObjectId of the student
 * @returns {Object} Student document (without password) if found
 * @returns {Object} 404 if not found or invalid ID format
 * @returns {Object} 500 for database errors
 */
router.get("/:id", async (req, res) => {
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
 * POST /api/students
 *
 * Creates a new student account.
 * Used during registration process.
 *
 * SECURITY WARNING:
 * - Password should be hashed with bcrypt before saving!
 * - Current implementation stores plain text (for development only)
 *
 * Required fields:
 * - firstName, lastName: User's name
 * - email: Must be unique
 * - password: Required unless using Google OAuth
 *
 * Optional fields:
 * - phone, avatar, bio, learningGoals
 * - preferredLanguage, timezone, skillLevel
 * - interests: Array for AI recommendations
 * - notifications: Preference object
 *
 * Error Handling:
 * - Returns 400 for duplicate email (code 11000)
 * - Returns 400 for validation errors
 *
 * @param {Object} req.body - Student registration data
 * @returns {Object} 201 with created student (password excluded)
 * @returns {Object} 400 for validation/duplicate errors
 */
router.post("/", async (req, res) => {
  const { email } = req.body;

  try {
      if (email) {
          const existingTeacher = await Teacher.findOne({ email });
          if (existingTeacher) {
              return res.status(400).json({ message: "This email is registered as a Teacher. Accounts cannot be both." });
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
      return res.status(400).json({ message: "Email already exists as a Student" });
    }
    res.status(400).json({ message: error.message });
  }
});

/**
 * PUT /api/students/:id
 *
 * Updates an existing student's profile.
 * Used when student saves changes on their profile page.
 *
 * Only allows updating specific fields (not email or password).
 * Email changes should go through a verification process.
 * Password changes should use a dedicated endpoint with current password verification.
 *
 * NOTE: Undefined fields are removed from update object to prevent
 * accidentally setting fields to undefined.
 *
 * @param {string} req.params.id - MongoDB ObjectId of the student
 * @param {Object} req.body - Fields to update
 * @returns {Object} Updated student document (without password)
 * @returns {Object} 404 if student not found
 * @returns {Object} 400 for validation errors
 */
router.put("/:id", async (req, res) => {
  try {
    // Whitelist of fields that can be updated
    // Note: email and password are NOT included for security
    const updateFields = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      avatar: req.body.avatar,
      bio: req.body.bio,
      learningGoals: req.body.learningGoals,
      preferredLanguage: req.body.preferredLanguage,
      timezone: req.body.timezone,
      skillLevel: req.body.skillLevel,
      interests: req.body.interests,
      notifications: req.body.notifications,
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
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
 * DELETE /api/students/:id
 *
 * Permanently deletes a student account.
 * WARNING: This action is irreversible!
 *
 * TODO: In production:
 * - Require re-authentication before deletion
 * - Consider soft delete (set isActive = false) instead
 * - Delete or anonymize related data (bookings, files, etc.)
 * - Send confirmation email
 *
 * @param {string} req.params.id - MongoDB ObjectId of the student
 * @returns {Object} Success message if deleted
 * @returns {Object} 404 if student not found
 * @returns {Object} 500 for database errors
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
 * POST /api/students/login
 *
 * Authenticates a student and returns a JWT token.
 * Used during login process.
 *
 * Required fields:
 * - email: Student's email address
 * - password: Student's password
 *
 * NOTE: Currently compares plain text passwords.
 * TODO: Implement bcrypt password hashing for production.
 *
 * @param {Object} req.body - Login credentials { email, password }
 * @returns {Object} 200 with JWT token and user info
 * @returns {Object} 401 if invalid credentials
 * @returns {Object} 500 for database errors
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const student = await Student.findOne({ email: email.toLowerCase().trim() });
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
 * GET /api/students/email/:email
 *
 * Fetches a student by their email address.
 * Useful for authentication and login flows.
 *
 * NOTE: This route should come BEFORE /:id to prevent
 * "email" being interpreted as an ID. However, since email
 * contains "@", it won't match a valid ObjectId anyway.
 *
 * @param {string} req.params.email - Student's email address
 * @returns {Object} Student document (without password)
 * @returns {Object} 404 if no student with this email
 * @returns {Object} 500 for database errors
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
 * PATCH /api/students/:id/notifications
 *
 * Updates only the notification preferences for a student.
 * Used on the Settings tab of the student profile.
 *
 * Using PATCH (not PUT) because we're partially updating
 * just the notifications sub-document, not the entire profile.
 *
 * Expected request body format:
 * {
 *   "email": true,
 *   "sms": false,
 *   "bookingReminders": true,
 *   "promotions": false
 * }
 *
 * @param {string} req.params.id - MongoDB ObjectId of the student
 * @param {Object} req.body - Notification preferences object
 * @returns {Object} Updated student document (without password)
 * @returns {Object} 404 if student not found
 * @returns {Object} 400 for validation errors
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

export default router;
