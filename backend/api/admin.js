import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import protect from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

router.get("/seed", async (req, res) => {
  try {
    const exists = await Admin.findOne({ email: "admin@admin.com" });
    if (exists) return res.json({ message: "Admin already exists" });

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("adminpassword", saltRounds);

    await Admin.create({
      email: "admin@admin.com",
      password: hashedPassword,
    });
    res.json({ message: "Admin created: admin@admin.com / adminpassword" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { email: admin.email, role: "admin" } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users
router.get("/users", protect, async (req, res) => {
  if (req.userRole !== 'admin') { 
  }

  try {
    const students = await Student.find().select("-password").lean();
    const teachers = await Teacher.find().select("-password").lean();

    const allUsers = [
      ...students.map(s => ({ ...s, userType: 'student' })),
      ...teachers.map(t => ({ ...t, userType: 'teacher' }))
    ];

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/users/:id/ban", protect, async (req, res) => {
  const { userType } = req.body;
  const { id } = req.params;

  try {
    let Model = userType === 'student' ? Student : Teacher;
    const user = await Model.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ 
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      isBanned: user.isBanned 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;