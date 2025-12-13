import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const { id: googleId, displayName, emails, photos } = profile;
        const email = emails?.[0]?.value;
        const avatar = photos?.[0]?.value;
        const nameParts = displayName?.split(" ") || [];
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        if (!email) {
          return done(new Error("Email not provided by Google"), null);
        }

        // Store profile in session for role selection
        const userProfile = {
          googleId,
          email,
          firstName,
          lastName,
          name: displayName,
          avatar,
        };

        return done(null, userProfile);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (minimal - just pass through)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 * Query params: ?role=student or ?role=teacher
 */
router.get(
  "/google",
  (req, res, next) => {
    // Store role in session for callback
    if (req.query.role) {
      req.session.oauthRole = req.query.role;
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback
 * Expects ?role=student or ?role=teacher query parameter
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=google_auth_failed" }),
  async (req, res) => {
    try {
      // Get role from session (stored during initial redirect)
      const role = req.session?.oauthRole || req.query.role || "student";
      const googleProfile = req.user;
      
      // Clear OAuth role from session
      if (req.session) {
        delete req.session.oauthRole;
      }

      if (!role || !["student", "teacher"].includes(role)) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=invalid_role`);
      }

      let user;
      const Model = role === "student" ? Student : Teacher;

      // Check if user exists with this Google ID
      user = await Model.findOne({ googleId: googleProfile.googleId });

      // If not found by Google ID, check by email
      if (!user) {
        user = await Model.findOne({ email: googleProfile.email.toLowerCase() });
        
        if (user) {
          // Link Google account to existing email account
          user.googleId = googleProfile.googleId;
          if (googleProfile.avatar && !user.avatar) {
            user.avatar = googleProfile.avatar;
          }
          await user.save();
        }
      }

      // Create new user if doesn't exist
      if (!user) {
        if (role === "student") {
          user = new Student({
            googleId: googleProfile.googleId,
            email: googleProfile.email.toLowerCase(),
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            avatar: googleProfile.avatar || "",
            isActive: true,
            isVerified: true, // Google emails are verified
          });
        } else {
          user = new Teacher({
            googleId: googleProfile.googleId,
            email: googleProfile.email.toLowerCase(),
            name: googleProfile.name,
            avatar: googleProfile.avatar || "",
            isActive: true,
            isApproved: false, // Teachers need approval
          });
        }
        await user.save();
      }

      // Check if account is banned
      if (user.isBanned) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=account_banned`);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: role,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Store JWT in session for hybrid approach
      req.session.token = token;
      req.session.userId = user._id.toString();
      req.session.userRole = role;

      // Get user data for frontend
      const userData = role === "student" 
        ? {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar,
            role: "student",
          }
        : {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: "teacher",
          };

      // Redirect to frontend with token and user data
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&role=${role}&user=${userDataEncoded}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_error`);
    }
  }
);

export default router;
