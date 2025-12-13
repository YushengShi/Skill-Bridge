import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Validate Google OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️  Google OAuth credentials not found in environment variables.");
  console.warn("   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.");
  console.warn("   Google OAuth login will not work until credentials are configured.");
}

// Configure Google OAuth Strategy
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
  `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
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
    // Check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_not_configured`
      );
    }

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
      console.log("OAuth callback received");
      console.log("req.user:", req.user);
      console.log("req.session:", req.session);
      console.log("req.query:", req.query);

      // Check if Google profile was received
      if (!req.user) {
        console.error("No user profile received from Google");
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=no_profile`);
      }

      // Get role from session (stored during initial redirect)
      const role = req.session?.oauthRole || req.query.role || "student";
      const googleProfile = req.user;
      
      console.log("Google profile:", {
        googleId: googleProfile.googleId,
        email: googleProfile.email,
        name: googleProfile.name,
        role: role
      });
      
      // Clear OAuth role from session
      if (req.session) {
        delete req.session.oauthRole;
      }

      if (!role || !["student", "teacher"].includes(role)) {
        console.error("Invalid role:", role);
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=invalid_role`);
      }

      // Validate Google profile has required fields
      if (!googleProfile.googleId || !googleProfile.email) {
        console.error("Missing required Google profile fields:", {
          hasGoogleId: !!googleProfile.googleId,
          hasEmail: !!googleProfile.email
        });
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=incomplete_profile`);
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
        console.log("Creating new user with role:", role);
        if (role === "student") {
          // Ensure firstName and lastName exist (required fields)
          // Handle cases where Google only provides a single name
          let firstName = googleProfile.firstName || "";
          let lastName = googleProfile.lastName || "";
          
          // If we have the full name, try to split it
          if (googleProfile.name) {
            const nameParts = googleProfile.name.trim().split(/\s+/);
            if (nameParts.length > 0 && !firstName) {
              firstName = nameParts[0];
            }
            if (nameParts.length > 1 && !lastName) {
              lastName = nameParts.slice(1).join(" ");
            }
          }
          
          // Fallback: if still no firstName, use email username or "User"
          if (!firstName || firstName.trim() === "") {
            firstName = googleProfile.email.split("@")[0] || "User";
          }
          
          // Fallback: if still no lastName, use a default or email domain
          if (!lastName || lastName.trim() === "") {
            lastName = "User"; // Default value since it's required
          }
          
          console.log("Creating student with:", { firstName, lastName, email: googleProfile.email });
          
          user = new Student({
            googleId: googleProfile.googleId,
            email: googleProfile.email.toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            avatar: googleProfile.avatar || "",
            isActive: true,
            isVerified: true, // Google emails are verified
          });
        } else {
          // Ensure name exists (required field)
          const name = googleProfile.name || `${googleProfile.firstName || ""} ${googleProfile.lastName || ""}`.trim() || "Teacher";
          
          user = new Teacher({
            googleId: googleProfile.googleId,
            email: googleProfile.email.toLowerCase(),
            name: name,
            avatar: googleProfile.avatar || "",
            isActive: true,
            isApproved: false, // Teachers need approval
          });
        }
        
        try {
          await user.save();
          console.log("User created successfully:", user._id);
        } catch (saveError) {
          console.error("Error saving user:", saveError);
          throw saveError;
        }
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
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      
      // Provide more specific error information
      let errorType = "oauth_error";
      if (error.name === "ValidationError") {
        errorType = "validation_error";
        console.error("Validation errors:", error.errors);
      } else if (error.name === "MongoServerError") {
        errorType = "database_error";
      }
      
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=${errorType}`);
    }
  }
);

export default router;
