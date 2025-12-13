import { Router } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

const router = Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Google OAuth2 configuration for authentication (different from calendar)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI_AUTH ||
    "http://localhost:3000/api/auth/google/callback"
);

// Scopes for user authentication
const AUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * ================================================================================
 * GOOGLE AUTHENTICATION ROUTES
 * ================================================================================
 *
 * Handles Google OAuth login for both students and teachers
 * - Get OAuth URL for login
 * - Handle OAuth callback and create/update user accounts
 * - Return JWT tokens for authenticated sessions
 * ================================================================================
 */

/**
 * @swagger
 * /api/auth/google/url:
 *   get:
 *     summary: Get Google OAuth URL for login
 *     description: Returns the Google OAuth URL for user authentication
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, teacher]
 *         description: User role for registration/login
 *     responses:
 *       200:
 *         description: OAuth URL generated successfully
 */
router.get("/google/url", async (req, res) => {
  try {
    const { role = "student" } = req.query;

    if (!["student", "teacher"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be 'student' or 'teacher'" });
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: AUTH_SCOPES,
      state: role, // Pass role in state parameter
      prompt: "consent", // Force consent screen
    });

    res.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ message: "Failed to generate auth URL" });
  }
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles the OAuth callback from Google and creates/updates user accounts
 *     tags: [Auth]
 */
router.get("/google/callback", async (req, res) => {
  const { code, state: role } = req.query;

  console.log("🔐 Google OAuth callback received");
  console.log("Query params:", req.query);
  console.log("Role:", role);
  console.log("Code present:", !!code);

  if (!code) {
    console.log("❌ No authorization code received");
    return res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/login?error=No authorization code`
    );
  }

  if (!["student", "teacher"].includes(role)) {
    console.log("❌ Invalid role in callback");
    return res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/login?error=Invalid role`
    );
  }

  try {
    // Exchange code for tokens
    console.log("🔄 Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Tokens received");

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log(
      "🔍 Raw Google user info response:",
      JSON.stringify(userInfo.data, null, 2)
    );

    const {
      id: googleId,
      email,
      name,
      given_name,
      family_name,
      picture,
    } = userInfo.data;

    console.log("👤 Google user info:", {
      email,
      name,
      given_name,
      family_name,
      googleId,
    });

    // Parse name properly - handle various Google API response formats
    let firstName = given_name || "";
    let lastName = family_name || "";
    let fullName = name || "";

    // If we have full name but no first/last, try to parse it
    if (fullName && (!firstName || !lastName)) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length >= 1 && !firstName) {
        firstName = nameParts[0];
      }
      if (nameParts.length >= 2 && !lastName) {
        lastName = nameParts.slice(1).join(" ");
      }
    }

    // If we still don't have names, use email prefix as fallback
    if (!firstName && email) {
      firstName = email.split("@")[0];
    }

    // Ensure we have at least minimal names
    if (!firstName) firstName = role === "student" ? "Student" : "Teacher";
    if (!lastName) lastName = "";
    if (!fullName) fullName = `${firstName} ${lastName}`.trim();

    console.log("📝 Parsed names:", { firstName, lastName, fullName, role });

    let user;
    let isNewUser = false;

    if (role === "student") {
      // Check if student exists
      user = await Student.findOne({ $or: [{ email }, { googleId }] });

      if (!user) {
        // Create new student
        user = new Student({
          email,
          firstName,
          lastName,
          googleId,
          avatar: picture,
          isActive: true,
          password: "", // No password for OAuth users
        });
        await user.save();
        isNewUser = true;
        console.log("✅ New student created:", user._id);
      } else {
        // Update existing student with Google info if not already set
        if (!user.googleId) {
          user.googleId = googleId;
          user.avatar = user.avatar || picture;
          await user.save();
        }
      }
    } else {
      // Check if teacher exists
      user = await Teacher.findOne({ $or: [{ email }, { googleId }] });

      if (!user) {
        // Create new teacher
        user = new Teacher({
          email,
          name: fullName,
          googleId,
          avatar: picture,
          isActive: true,
          password: "", // No password for OAuth users
          subject: "General", // Default subject
          verified: false,
        });
        await user.save();
        isNewUser = true;
        console.log("✅ New teacher created:", user._id);
      } else {
        // Update existing teacher with Google info if not already set
        if (!user.googleId) {
          user.googleId = googleId;
          user.avatar = user.avatar || picture;
          await user.save();
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    const redirectUrl = new URL(
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("newUser", isNewUser.toString());

    console.log("🔄 Redirecting to:", redirectUrl.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/login?error=${encodeURIComponent(error.message)}`
    );
  }
});

export default router;
