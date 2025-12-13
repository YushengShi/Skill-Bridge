import mongoose from "mongoose";

/**
 * ================================================================================
 * TEACHER MODEL
 * ================================================================================
 *
 * Represents teachers who offer lessons on the SkillBridge platform.
 * This schema stores all teacher-related data including:
 *
 * SECTIONS:
 * 1. Basic Information - name, email, tagline, bio, avatar
 * 2. Ratings & Stats - rating, reviewCount, lessonCount, studentsCount
 * 3. Pricing - trial and standard lesson prices
 * 4. Profile Details - education, languages, location, responseTime
 * 5. Skills & Expertise - skills array, specializations, teachingStyle
 * 6. Availability - weekly schedule with time slots
 * 7. Teaching Materials - uploaded resources (PDFs, links)
 * 8. Certificates - verified credentials
 * 9. Reviews - student feedback with ratings
 * 10. Account Status - approval and active flags
 *
 * RELATIONSHIPS:
 * - Reviews reference Student model via studentId
 * - Bookings reference this model (see Booking.js)
 *
 * METHODS:
 * - calculateRating(): Computes average rating from reviews
 *
 * HOOKS:
 * - pre('save'): Auto-updates updatedAt timestamp
 *
 * ================================================================================
 */
const teacherSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  tagline: {
    type: String,
    trim: true,
  }, // e.g. "Professional Teacher"
  role: {
    type: String,
    default: "teacher",
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    maxlength: 1000,
  },
  avatar: {
    type: String,
  }, // URL to image

  // Ratings & Stats
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  lessonCount: {
    type: Number,
    default: 0,
  },
  studentsCount: {
    type: Number,
    default: 0,
  },

  // Pricing
  prices: {
    trial: {
      type: Number,
      default: 10,
    }, // e.g. 8
    standard: {
      type: Number,
      default: 25,
    }, // e.g. 20
  },

  // Profile Details
  education: {
    type: String,
  },
  languages: [
    {
      type: String,
    },
  ],
  location: {
    type: String,
  },
  responseTime: {
    type: String,
    default: "Within 24 hours",
  },

  // Skills & Expertise
  skills: [
    {
      type: String,
    },
  ],
  specializations: [
    {
      type: String,
    },
  ],
  teachingStyle: {
    type: String,
  },

  // Availability
  availability: {
    monday: [{ type: String }],
    tuesday: [{ type: String }],
    wednesday: [{ type: String }],
    thursday: [{ type: String }],
    friday: [{ type: String }],
    saturday: [{ type: String }],
    sunday: [{ type: String }],
  },
  timezone: {
    type: String,
    default: "UTC",
  },

  // Teaching Materials
  materials: [
    {
      name: String,
      type: String,
      url: String,
      uploadDate: { type: Date, default: Date.now },
    },
  ],

  // Certificates
  certificates: [
    {
      name: String,
      issuer: String,
      imageUrl: String,
      verifiedAt: Date,
    },
  ],

  // Reviews
  reviews: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      studentName: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: Date.now },
    },
  ],

  // Account Status
  isApproved: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isBanned: {
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
 * whenever a teacher document is modified and saved.
 *
 * NOTE: This uses a regular function (not arrow) to access 'this'
 * which refers to the document being saved.
 */
teacherSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * ==================== INSTANCE METHODS ====================
 */

/**
 * Calculates the average rating from all reviews.
 * Updates both the rating and reviewCount fields.
 *
 * Use this method after adding/removing reviews:
 * ```
 * teacher.reviews.push(newReview);
 * teacher.calculateRating();
 * await teacher.save();
 * ```
 *
 * @returns {number} The calculated average rating (1-5)
 */
teacherSchema.methods.calculateRating = function () {
  // Return default rating if no reviews exist
  if (this.reviews.length === 0) return 5.0;

  // Sum all ratings and calculate average
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = sum / this.reviews.length;
  this.reviewCount = this.reviews.length;

  return this.rating;
};

export default mongoose.model("Teacher", teacherSchema);
