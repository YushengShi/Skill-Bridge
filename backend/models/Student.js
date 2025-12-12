import mongoose from "mongoose";

/**
 * ================================================================================
 * STUDENT MODEL
 * ================================================================================
 *
 * Represents students who use the SkillBridge platform to find and book teachers.
 * This schema handles both email/password and Google OAuth authentication.
 *
 * SECTIONS:
 * 1. Basic Information - firstName, lastName, email, password
 * 2. Google OAuth - googleId for social login
 * 3. Profile Information - phone, avatar, bio
 * 4. Learning Preferences - goals, language, timezone, skillLevel
 * 5. Interests - array for AI-powered teacher recommendations
 * 6. Role - student/teacher/admin for role-based access control
 * 7. Notification Preferences - email, sms, reminders, promotions
 * 8. Account Status - isActive, isVerified flags
 *
 * AUTHENTICATION NOTES:
 * - Password is required ONLY if googleId is not present
 * - This allows flexible auth (email/password OR Google OAuth)
 * - Passwords should be hashed with bcrypt before saving (TODO)
 *
 * INDEXES:
 * - email: unique (enforces one account per email)
 * - googleId: unique, sparse (allows multiple null values)
 *
 * VIRTUALS:
 * - fullName: Computed property returning "firstName lastName"
 *
 * ================================================================================
 */
const studentSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    /**
     * Password is conditionally required based on authentication method.
     *
     * If the user signs up with Google OAuth (googleId is set),
     * they don't need a password since they authenticate via Google.
     *
     * If using email/password auth (no googleId), password is required.
     *
     * NOTE: Cannot use arrow function here - need 'this' context
     */
    required: function () {
      return !this.googleId; // Password required only if not using Google OAuth
    },
  },

  // Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Profile Information
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    maxlength: 500,
  },

  // Learning Preferences
  learningGoals: {
    type: String,
    maxlength: 500,
  },
  preferredLanguage: {
    type: String,
    default: "English",
  },
  timezone: {
    type: String,
    default: "UTC",
  },
  skillLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "fluent"],
    default: "beginner",
  },

  // Interests (for AI recommendations)
  interests: [
    {
      type: String,
    },
  ],

  /**
   * Learning Progress Tracking
   *
   * Stores the student's progress in each subject they're learning.
   * Updated after lessons are completed to reflect advancement.
   *
   * Each entry contains:
   * - subject: Name of the skill/subject (e.g., "English", "Spanish", "Python")
   * - progress: Percentage of completion (0-100%)
   *
   * Progress can be calculated based on:
   * - Number of completed lessons in that subject
   * - Teacher assessments
   * - Quiz/test scores
   */
  learningProgress: [
    {
      subject: { type: String, required: true },
      progress: { type: Number, default: 0, min: 0, max: 100 },
    },
  ],

  // Role
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },

  // Notification Preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    bookingReminders: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * ==================== MONGOOSE MIDDLEWARE (HOOKS) ====================
 */

/**
 * Pre-save hook: Automatically update the updatedAt timestamp
 * whenever a student document is modified and saved.
 *
 * NOTE: This uses a regular function (not arrow) to access 'this'
 * which refers to the document being saved.
 */
studentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * ==================== VIRTUAL PROPERTIES ====================
 */

/**
 * Virtual property: fullName
 *
 * Computes the full name by combining firstName and lastName.
 * This is a "virtual" because it's not stored in the database,
 * but calculated on-the-fly when accessed.
 *
 * Usage: student.fullName returns "John Doe"
 *
 * NOTE: Uses regular function to access 'this' (the document)
 */
studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Schema options: Include virtuals in JSON/Object output
 *
 * By default, Mongoose doesn't include virtuals when converting
 * documents to JSON (for API responses) or Objects.
 * These settings ensure fullName appears in API responses.
 */
studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

export default mongoose.model("Student", studentSchema);
