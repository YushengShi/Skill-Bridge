import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { setupSwagger } from "./config/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// MongoDB connection
const mongoDB_URI = "mongodb://localhost:27017/skillbridge";
mongoose
  .connect(mongoDB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Session management (stores JWT tokens server-side for logout/invalidation)
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
    name: "skillbridge.sid",
  })
);

// Initialize Passport for OAuth
app.use(passport.initialize());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Stripe webhook route
import webhookRoutes from "./api/webhook.js";
app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

// we write our routes here
import paymentRoutes from "./api/payment.js";
import teacherRoutes from "./api/teachers.js";
import studentRoutes from "./api/students.js";
import aiRoutes from "./api/ai-recommendations.js";
import calendarRoutes from "./api/calendar.js";
import adminRoutes from "./api/admin.js";
import authRoutes from "./api/auth.js";

app.use("/api/payment", paymentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the API server.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Keep the process alive
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
