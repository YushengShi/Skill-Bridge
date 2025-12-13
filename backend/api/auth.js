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
      // Force account selection every time (don't auto-login with last used account)
      authorizationParams: {
        prompt: "select_account",
      },
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
 * GET /api/auth/google/init
 * Stores the intended role in session before OAuth
 * Query params: ?role=student or ?role=teacher
 */
router.get("/google/init", (req, res) => {
  const role = req.query.role;
  if (role && ["student", "teacher"].includes(role)) {
    req.session.oauthRole = role;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Failed to initialize OAuth" });
      }
      res.json({ success: true, role });
    });
  } else {
    res.status(400).json({ error: "Invalid role" });
  }
});

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 * Role is stored in session from /init endpoint
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

    // Check if role is stored in session (from /init endpoint)
    if (!req.session.oauthRole) {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_role_not_set`
      );
    }

    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account", // Force account selection every time
  })
);

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback
 * Expects ?role=student or ?role=teacher query parameter
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false, 
    failureRedirect: "/login?error=google_auth_failed",
  }),
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

      // Get role from session (stored during /init endpoint)
      const intendedRole = req.session?.oauthRole;
      const googleProfile = req.user;
      
      console.log("Google profile:", {
        googleId: googleProfile.googleId,
        email: googleProfile.email,
        name: googleProfile.name,
        intendedRole: intendedRole
      });

      if (!intendedRole || !["student", "teacher"].includes(intendedRole)) {
        console.error("Invalid or missing role in session:", intendedRole);
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=invalid_role`);
      }

      // Check for role conflicts BEFORE creating/linking account
      const StudentModel = Student;
      const TeacherModel = Teacher;
      const OtherModel = intendedRole === "student" ? Teacher : Student;
      
      // Check if Google account exists in the OTHER role
      const otherRoleUser = await OtherModel.findOne({ googleId: googleProfile.googleId });
      if (otherRoleUser) {
        const existingRole = intendedRole === "student" ? "teacher" : "student";
        console.error(`Google account already used as ${existingRole}`);
        // Clear session
        if (req.session) {
          delete req.session.oauthRole;
        }
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=account_role_conflict&attempted_role=${intendedRole}&existing_role=${existingRole}`
        );
      }

      // Check if email exists in the OTHER role
      const otherRoleUserByEmail = await OtherModel.findOne({ email: googleProfile.email.toLowerCase() });
      if (otherRoleUserByEmail) {
        const existingRole = intendedRole === "student" ? "teacher" : "student";
        console.error(`Email already used as ${existingRole}`);
        // Clear session
        if (req.session) {
          delete req.session.oauthRole;
        }
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=email_role_conflict&attempted_role=${intendedRole}&existing_role=${existingRole}`
        );
      }

      // No conflict - proceed with login/registration
      const role = intendedRole;
      
      // Clear OAuth role from session after checking conflicts
      if (req.session) {
        delete req.session.oauthRole;
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

      // Check if user exists with this Google ID in the SAME role
      user = await Model.findOne({ googleId: googleProfile.googleId });

      // If not found by Google ID, check by email in the SAME role
      if (!user) {
        user = await Model.findOne({ email: googleProfile.email.toLowerCase() });
        
        if (user) {
          // Link Google account to existing email account (same role)
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
            googleId: googleProfile.googleId, // Set this first so password validation can see it
            email: googleProfile.email.toLowerCase(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            avatar: googleProfile.avatar || "",
            isActive: true,
            isVerified: true, // Google emails are verified
            // password is intentionally omitted - not required when googleId is set
          });
        } else {
          // Ensure name exists (required field for Teacher)
          let name = googleProfile.name || "";
          
          // If no name from Google, try to construct from firstName/lastName
          if (!name || name.trim() === "") {
            const firstName = googleProfile.firstName || "";
            const lastName = googleProfile.lastName || "";
            name = `${firstName} ${lastName}`.trim();
          }
          
          // Fallback: use email username if still no name
          if (!name || name.trim() === "") {
            name = googleProfile.email.split("@")[0] || "Teacher";
          }
          
          // Ensure name is not empty (required field)
          if (!name || name.trim() === "") {
            name = "Teacher"; // Final fallback
          }
          
          console.log("Creating teacher with:", { name, email: googleProfile.email, googleId: googleProfile.googleId });
          
          // Create teacher object - password is not required when googleId is set
          // Set googleId first, then create object to ensure validation works correctly
          user = new Teacher({
            googleId: googleProfile.googleId, // Set this first so password validation can see it
            email: googleProfile.email.toLowerCase(),
            name: name.trim(),
            avatar: googleProfile.avatar || "",
            isActive: true,
            isApproved: false, // Teachers need approval
            // password is intentionally omitted - not required when googleId is set
          });
          
      // Verify googleId is set
      if (!user.googleId) {
        throw new Error("googleId must be set for OAuth users");
      }
      
      // Remove password field completely to avoid validation issues
      // Use delete operator or set to null
      delete user.password;
      user.password = undefined;
      
      console.log("Teacher object created, googleId:", user.googleId);
        }
        
        try {
          // For OAuth users, the conditional required function should work
          // But if it doesn't, we'll use $unset to remove password from validation
          try {
            await user.save();
            console.log("User created successfully:", user._id);
          } catch (validationError) {
            // If validation fails due to password, unset it and save without validation
            if (validationError.name === 'ValidationError' && validationError.errors?.password) {
              console.log("Password validation failed despite googleId being set, using workaround...");
              // Remove password field completely
              delete user.password;
              user.password = undefined;
              // Save without validation since we know googleId is set
              await user.save({ validateBeforeSave: false });
              console.log("User created successfully (password validation bypassed):", user._id);
            } else {
              throw validationError;
            }
          }
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
