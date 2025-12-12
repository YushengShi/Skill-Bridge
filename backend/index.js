import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

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

// Stripe webhook route
import webhookRoutes from "./api/webhook.js";
app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

app.use(express.json());
// we write our routes here
import paymentRoutes from "./api/payment.js";
import teacherRoutes from "./api/teachers.js";
import studentRoutes from "./api/students.js";
import aiRoutes from "./api/ai-recommendations.js";

app.use("/api/payment", paymentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/ai", aiRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
