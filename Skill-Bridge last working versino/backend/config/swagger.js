import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * Swagger/OpenAPI Configuration
 *
 * This module configures Swagger documentation for the SkillBridge API.
 * Access the documentation at: http://localhost:3000/docs
 */

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkillBridge API",
      version: "1.0.0",
      description: `
# SkillBridge API Documentation

SkillBridge is an online tutoring platform connecting students with teachers.

## Features
- **Student Management**: Registration, login, profile management, and dashboard
- **Teacher Management**: Registration, login, profile management, and dashboard
- **Booking System**: Lesson booking with Stripe payment integration
- **AI Recommendations**: AI-powered teacher recommendations based on student preferences

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
Currently no rate limiting is implemented in development.
      `,
      contact: {
        name: "SkillBridge Support",
        email: "support@skillbridge.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Students",
        description:
          "Student registration, authentication, and profile management",
      },
      {
        name: "Teachers",
        description:
          "Teacher registration, authentication, and profile management",
      },
      {
        name: "Payments",
        description: "Stripe payment and checkout endpoints",
      },
      {
        name: "AI",
        description: "AI-powered teacher recommendations",
      },
      {
        name: "Webhooks",
        description: "Stripe webhook handlers",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        // ==================== STUDENT SCHEMAS ====================
        Student: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "MongoDB ObjectId",
              example: "507f1f77bcf86cd799439011",
            },
            firstName: {
              type: "string",
              description: "Student's first name",
              example: "John",
            },
            lastName: {
              type: "string",
              description: "Student's last name",
              example: "Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "Student's email address (unique)",
              example: "john.doe@example.com",
            },
            phone: {
              type: "string",
              description: "Phone number",
              example: "+1234567890",
            },
            avatar: {
              type: "string",
              description: "URL to avatar image",
              example: "http://localhost:3000/uploads/avatar.jpg",
            },
            bio: {
              type: "string",
              maxLength: 500,
              description: "Short biography",
              example: "Passionate learner interested in languages",
            },
            learningGoals: {
              type: "string",
              maxLength: 500,
              description: "Student's learning objectives",
              example: "Become fluent in English for business",
            },
            preferredLanguage: {
              type: "string",
              description: "Preferred language for learning",
              example: "English",
            },
            timezone: {
              type: "string",
              description: "Student's timezone",
              example: "America/New_York",
            },
            skillLevel: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
              description: "Current skill level",
              example: "intermediate",
            },
            notifications: {
              type: "object",
              properties: {
                email: { type: "boolean", example: true },
                sms: { type: "boolean", example: false },
                bookingReminders: { type: "boolean", example: true },
                promotions: { type: "boolean", example: false },
              },
            },
            role: {
              type: "string",
              enum: ["student"],
              example: "student",
            },
            isActive: {
              type: "boolean",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        StudentRegistration: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: {
              type: "string",
              example: "John",
            },
            lastName: {
              type: "string",
              example: "Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "securePassword123",
            },
            notifications: {
              type: "object",
              properties: {
                email: { type: "boolean" },
                sms: { type: "boolean" },
                bookingReminders: { type: "boolean" },
                promotions: { type: "boolean" },
              },
            },
          },
        },
        StudentLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            password: {
              type: "string",
              example: "securePassword123",
            },
          },
        },
        StudentDashboard: {
          type: "object",
          properties: {
            stats: {
              type: "object",
              properties: {
                upcomingLessons: { type: "integer", example: 3 },
                completedLessons: { type: "integer", example: 15 },
                totalHours: { type: "integer", example: 20 },
                teachersWorkedWith: { type: "integer", example: 4 },
              },
            },
            upcomingLessons: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  teacherName: { type: "string" },
                  teacherAvatar: { type: "string" },
                  subject: { type: "string" },
                  date: { type: "string", format: "date-time" },
                  time: { type: "string" },
                  duration: { type: "integer" },
                  status: { type: "string" },
                  meetingLink: { type: "string" },
                },
              },
            },
            recentActivity: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  message: { type: "string" },
                  icon: { type: "string" },
                  time: { type: "string" },
                },
              },
            },
            recommendedTeachers: {
              type: "array",
              items: { $ref: "#/components/schemas/TeacherSummary" },
            },
          },
        },

        // ==================== TEACHER SCHEMAS ====================
        Teacher: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "Jane Smith",
            },
            email: {
              type: "string",
              format: "email",
              example: "jane.smith@example.com",
            },
            tagline: {
              type: "string",
              example: "Professional English Teacher",
            },
            bio: {
              type: "string",
              example: "10+ years of teaching experience",
            },
            avatar: {
              type: "string",
              example: "https://i.pravatar.cc/150?img=5",
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5,
              example: 4.8,
            },
            reviewCount: {
              type: "integer",
              example: 45,
            },
            lessonCount: {
              type: "integer",
              example: 1377,
            },
            studentsCount: {
              type: "integer",
              example: 89,
            },
            prices: {
              type: "object",
              properties: {
                trial: { type: "number", example: 10 },
                standard: { type: "number", example: 25 },
              },
            },
            skills: {
              type: "array",
              items: { type: "string" },
              example: ["Business English", "IELTS", "Conversation"],
            },
            specializations: {
              type: "array",
              items: { type: "string" },
              example: ["Interview Prep", "Academic Writing"],
            },
            languages: {
              type: "array",
              items: { type: "string" },
              example: ["English", "Spanish"],
            },
            teachingStyle: {
              type: "string",
              example: "Patient and structured approach",
            },
            availability: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
              },
              example: {
                monday: ["09:00", "10:00", "14:00"],
                wednesday: ["09:00", "11:00"],
              },
            },
            education: {
              type: "string",
              example: "MA in Applied Linguistics",
            },
            location: {
              type: "string",
              example: "New York, USA",
            },
            role: {
              type: "string",
              enum: ["teacher"],
              example: "teacher",
            },
            isApproved: {
              type: "boolean",
              example: true,
            },
            isActive: {
              type: "boolean",
              example: true,
            },
          },
        },
        TeacherSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            avatar: { type: "string" },
            subject: { type: "string" },
            rating: { type: "number" },
            price: { type: "number" },
          },
        },
        TeacherRegistration: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "Jane Smith",
            },
            email: {
              type: "string",
              format: "email",
              example: "jane.smith@example.com",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "securePassword123",
            },
          },
        },
        TeacherLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "jane.smith@example.com",
            },
            password: {
              type: "string",
              example: "securePassword123",
            },
          },
        },
        TeacherDashboard: {
          type: "object",
          properties: {
            teacher: {
              type: "object",
              properties: {
                name: { type: "string" },
                avatar: { type: "string" },
                subject: { type: "string" },
                verified: { type: "boolean" },
              },
            },
            stats: {
              type: "object",
              properties: {
                totalStudents: { type: "integer" },
                pendingBookings: { type: "integer" },
                todayLessons: { type: "integer" },
                monthlyEarnings: { type: "number" },
                averageRating: { type: "number" },
                totalReviews: { type: "integer" },
              },
            },
            todaySchedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  studentName: { type: "string" },
                  studentAvatar: { type: "string" },
                  subject: { type: "string" },
                  time: { type: "string" },
                  status: { type: "string" },
                  meetingLink: { type: "string" },
                },
              },
            },
            pendingBookings: {
              type: "array",
              items: { $ref: "#/components/schemas/BookingRequest" },
            },
            earningsData: {
              type: "object",
              properties: {
                thisMonth: { type: "number" },
                lastMonth: { type: "number" },
                pending: { type: "number" },
                available: { type: "number" },
                recentTransactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      studentName: { type: "string" },
                      amount: { type: "number" },
                      date: { type: "string" },
                      status: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },

        // ==================== BOOKING SCHEMAS ====================
        Booking: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            teacherId: {
              type: "string",
              description: "Reference to Teacher",
            },
            studentId: {
              type: "string",
              description: "Reference to Student",
            },
            lessonType: {
              type: "string",
              enum: ["trial", "standard"],
              example: "standard",
            },
            amount: {
              type: "number",
              description: "Price in USD",
              example: 25,
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "confirmed", "completed", "cancelled"],
              example: "confirmed",
            },
            scheduledDate: {
              type: "string",
              format: "date",
              example: "2024-12-20",
            },
            scheduledTime: {
              type: "string",
              example: "14:30",
            },
            duration: {
              type: "integer",
              description: "Duration in minutes",
              example: 60,
            },
            meetingLink: {
              type: "string",
              example: "https://meet.google.com/abc-xyz",
            },
            message: {
              type: "string",
              example: "I want to focus on business English",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        BookingRequest: {
          type: "object",
          properties: {
            id: { type: "string" },
            studentName: { type: "string" },
            studentAvatar: { type: "string" },
            subject: { type: "string" },
            requestedDate: { type: "string" },
            requestedTime: { type: "string" },
            message: { type: "string" },
            studentLevel: { type: "string" },
          },
        },

        // ==================== PAYMENT SCHEMAS ====================
        CheckoutSessionRequest: {
          type: "object",
          required: ["teacherId", "lessonType", "price", "teacherName"],
          properties: {
            teacherId: {
              type: "string",
              description: "MongoDB ObjectId of the teacher",
              example: "507f1f77bcf86cd799439011",
            },
            lessonType: {
              type: "string",
              enum: ["trial", "standard"],
              example: "standard",
            },
            price: {
              type: "number",
              description: "Lesson price in USD",
              example: 25,
            },
            teacherName: {
              type: "string",
              example: "Jane Smith",
            },
          },
        },
        CheckoutSessionResponse: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Stripe Checkout URL to redirect user",
              example: "https://checkout.stripe.com/...",
            },
          },
        },

        // ==================== AI SCHEMAS ====================
        AIRecommendationRequest: {
          type: "object",
          required: ["skillLevel", "schedule", "learningStyle", "budget"],
          properties: {
            skillLevel: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
              example: "intermediate",
            },
            schedule: {
              type: "string",
              enum: ["morning", "afternoon", "evening", "weekend", "flexible"],
              example: "evening",
            },
            learningStyle: {
              type: "string",
              enum: ["structured", "conversational", "intensive", "flexible"],
              example: "conversational",
            },
            budget: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "low: <$20, medium: $20-40, high: >$40",
              example: "medium",
            },
            subject: {
              type: "string",
              example: "Business English",
            },
            additionalInfo: {
              type: "string",
              example: "I have an interview next month",
            },
          },
        },
        AIRecommendationResponse: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: { $ref: "#/components/schemas/Teacher" },
            },
            aiInsight: {
              type: "string",
              description: "AI-generated explanation for the recommendations",
              example:
                "Based on your preference for evening lessons and conversational learning style...",
            },
          },
        },

        // ==================== COMMON SCHEMAS ====================
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error message description",
            },
            error: {
              type: "string",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT token for authentication",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              type: "object",
              description: "User data (student or teacher)",
            },
          },
        },
        SuccessMessage: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
          },
        },
      },
    },
  },
  apis: ["./api/*.js", "./index.js"],
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger documentation routes
 * @param {Express} app - Express application instance
 */
export const setupSwagger = (app) => {
  // Serve Swagger UI at /docs
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "SkillBridge API Documentation",
    })
  );

  // Serve raw OpenAPI spec as JSON
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.log("📚 Swagger docs available at http://localhost:3000/docs");
};

export default { setupSwagger, specs };
