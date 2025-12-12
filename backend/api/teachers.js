import { Router } from "express";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt"

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
router.get("/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select("-password");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Teacher not found" });
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
      return res.status(400).json({ message: "Email already exists as a Teacher" });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
        return res.status(400).json({ message: "This email is registered as a Student. Accounts cannot be both." });
    }

    const teacher = new Teacher({
      name,
      email,
      password,
      role: "teacher",
      prices: { trial: 15, standard: 30 } 
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


export default router;
