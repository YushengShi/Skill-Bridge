import { Router } from "express";
import Teacher from "../models/Teacher.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

/**
 * ================================================================================
 * AI RECOMMENDATIONS API
 * ================================================================================
 *
 * Uses Google Gemini API to analyze student preferences and recommend
 * the best matching teachers based on:
 * - Skill level (beginner, intermediate, advanced)
 * - Schedule preferences (morning, afternoon, evening, weekend)
 * - Learning style (structured, conversational, intensive, flexible)
 * - Budget range
 * - Subject/skill they want to learn
 *
 * ================================================================================
 */

/**
 * Factory function to create a Gemini AI client.
 * Lazily initializes the client only when needed to avoid startup errors
 * if the API key isn't configured but the endpoint isn't being used.
 *
 * @throws {Error} If GEMINI_API_KEY environment variable is not set
 * @returns {GoogleGenerativeAI} Configured Gemini client instance
 */
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * POST /api/ai/recommend
 *
 * Takes student questionnaire answers and returns AI-powered teacher recommendations.
 *
 * Request body:
 * - skillLevel: 'beginner' | 'intermediate' | 'advanced'
 * - schedule: 'morning' | 'afternoon' | 'evening' | 'weekend' | 'flexible'
 * - learningStyle: 'structured' | 'conversational' | 'intensive' | 'flexible'
 * - budget: 'low' | 'medium' | 'high' (low: <$20, medium: $20-40, high: >$40)
 * - subject: string (e.g., 'English', 'Business English', 'Interview Prep')
 * - additionalInfo: string (optional - any extra context from the student)
 *
 * @returns {Object} { recommendations: Teacher[], aiInsight: string }
 */
router.post("/recommend", async (req, res) => {
  try {
    const {
      skillLevel,
      schedule,
      learningStyle,
      budget,
      subject,
      additionalInfo = "",
    } = req.body;

    // Validate required fields
    if (!skillLevel || !schedule || !learningStyle || !budget) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["skillLevel", "schedule", "learningStyle", "budget"],
      });
    }

    // Fetch all active teachers from the database
    // We exclude password for security, even though it won't be sent to AI
    const teachers = await Teacher.find({ isActive: true }).select("-password");

    if (teachers.length === 0) {
      return res.status(404).json({
        error: "No teachers available",
        recommendations: [],
      });
    }

    // Transform teacher documents into a simplified format for AI analysis.
    // We only include fields relevant to matching (not sensitive data).
    // Converting ObjectId to string ensures proper JSON serialization.
    const teacherSummaries = teachers.map((teacher) => ({
      id: teacher._id.toString(), // Convert MongoDB ObjectId to string for AI
      name: teacher.name,
      tagline: teacher.tagline || "",
      bio: teacher.bio || "",
      rating: teacher.rating,
      lessonCount: teacher.lessonCount,
      trialPrice: teacher.prices?.trial || 10, // Default fallbacks for missing data
      standardPrice: teacher.prices?.standard || 25,
      skills: teacher.skills || [],
      specializations: teacher.specializations || [],
      teachingStyle: teacher.teachingStyle || "",
      availability: teacher.availability || {},
      languages: teacher.languages || [],
    }));

    // Build the prompt for Gemini - this constructs a detailed prompt
    // with student preferences and all available teacher data
    const prompt = buildRecommendationPrompt({
      skillLevel,
      schedule,
      learningStyle,
      budget,
      subject,
      additionalInfo,
      teachers: teacherSummaries,
    });

    // Initialize Gemini client and select the fast model for quick responses.
    // gemini-1.5-flash is optimized for speed while maintaining good quality.
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Send prompt to Gemini and await the response.
    // The AI will analyze teachers and return JSON with recommendations.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse the AI's JSON response to extract teacher IDs and insight text.
    // The parser handles both valid JSON and fallback text parsing.
    const { recommendedIds, aiInsight } = parseAIResponse(
      aiResponse,
      teacherSummaries
    );

    // Fetch full teacher details for recommended teachers
    const recommendedTeachers = teachers
      .filter((t) => recommendedIds.includes(t._id.toString()))
      .map((teacher) => ({
        id: teacher._id,
        name: teacher.name,
        tagline: teacher.tagline,
        bio: teacher.bio,
        avatar: teacher.avatar,
        rating: teacher.rating,
        lessonCount: teacher.lessonCount,
        prices: teacher.prices,
        skills: teacher.skills,
        specializations: teacher.specializations,
        teachingStyle: teacher.teachingStyle,
      }));

    // If AI didn't return valid recommendations, fall back to basic matching
    const finalRecommendations =
      recommendedTeachers.length > 0
        ? recommendedTeachers
        : getFallbackRecommendations(teachers, {
            skillLevel,
            budget,
            schedule,
          });

    res.json({
      success: true,
      recommendations: finalRecommendations.slice(0, 5), // Return top 5
      aiInsight:
        aiInsight ||
        "Based on your preferences, here are teachers that match your learning goals.",
      criteria: { skillLevel, schedule, learningStyle, budget, subject },
    });
  } catch (error) {
    console.error("AI Recommendation Error:", error);

    // If Gemini API fails, provide fallback recommendations
    if (
      error.message?.includes("GEMINI_API_KEY") ||
      error.message?.includes("API")
    ) {
      try {
        const teachers = await Teacher.find({ isActive: true })
          .select("-password")
          .limit(5);

        return res.json({
          success: true,
          recommendations: teachers.map((t) => ({
            id: t._id,
            name: t.name,
            tagline: t.tagline,
            bio: t.bio,
            avatar: t.avatar,
            rating: t.rating,
            lessonCount: t.lessonCount,
            prices: t.prices,
            skills: t.skills,
          })),
          aiInsight:
            "Here are some of our top-rated teachers. For personalized AI recommendations, please try again later.",
          fallback: true,
        });
      } catch (fallbackError) {
        return res.status(500).json({ error: "Failed to get recommendations" });
      }
    }

    res.status(500).json({
      error: "Failed to generate recommendations",
      message: error.message,
    });
  }
});

/**
 * Constructs a detailed prompt for Gemini AI to analyze and match teachers.
 *
 * The prompt follows a structured format:
 * 1. Sets the AI's role as an educational consultant
 * 2. Provides all student preferences in a clear format
 * 3. Includes complete teacher data as JSON for analysis
 * 4. Specifies matching criteria priorities
 * 5. Enforces a strict JSON response format for reliable parsing
 *
 * @param {Object} params - Student preferences and teacher data
 * @param {string} params.skillLevel - beginner/intermediate/advanced
 * @param {string} params.schedule - morning/afternoon/evening/weekend/flexible
 * @param {string} params.learningStyle - structured/conversational/intensive/flexible
 * @param {string} params.budget - low/medium/high
 * @param {string} params.subject - Subject the student wants to learn
 * @param {string} params.additionalInfo - Optional extra context
 * @param {Array} params.teachers - Simplified teacher data for AI analysis
 * @returns {string} Complete prompt string for Gemini
 */
function buildRecommendationPrompt({
  skillLevel,
  schedule,
  learningStyle,
  budget,
  subject,
  additionalInfo,
  teachers,
}) {
  // Map budget codes to human-readable price ranges for AI understanding
  const budgetRanges = {
    low: "under $20 per hour",
    medium: "$20-40 per hour",
    high: "above $40 per hour",
  };

  return `You are an expert educational consultant helping a student find the perfect teacher on our learning platform.

STUDENT PREFERENCES:
- Skill Level: ${skillLevel}
- Preferred Schedule: ${schedule}
- Learning Style: ${learningStyle} (${getLearningStyleDescription(
    learningStyle
  )})
- Budget: ${budgetRanges[budget] || budget}
- Subject Interest: ${subject || "General learning"}
${additionalInfo ? `- Additional Context: ${additionalInfo}` : ""}

AVAILABLE TEACHERS:
${JSON.stringify(teachers, null, 2)}

TASK:
Analyze the student's needs and the available teachers. Recommend the TOP 3-5 best matching teachers.

Consider:
1. Price alignment with budget
2. Teaching style matching learning preference
3. Experience level (lessonCount, rating) appropriate for skill level
4. Availability matching schedule preferences
5. Skills/specializations relevant to subject interest

RESPONSE FORMAT:
Return your response in this exact JSON format:
{
  "recommendedTeacherIds": ["id1", "id2", "id3"],
  "insight": "A 2-3 sentence personalized explanation of why these teachers are great matches for this specific student's needs."
}

Important: Only include the JSON in your response, no additional text.`;
}

/**
 * Returns a description for each learning style
 */
function getLearningStyleDescription(style) {
  const descriptions = {
    structured:
      "Prefers organized curriculum, clear goals, and systematic progress",
    conversational:
      "Prefers natural dialogue, practical scenarios, and interactive discussion",
    intensive:
      "Prefers fast-paced learning, immersive practice, and challenging exercises",
    flexible:
      "Open to various methods, adaptable approach based on daily needs",
  };
  return descriptions[style] || "Adaptable learning approach";
}

/**
 * Parses Gemini's response to extract structured recommendation data.
 *
 * The function handles two scenarios:
 * 1. Valid JSON response - Extracts recommendedTeacherIds and insight directly
 * 2. Malformed response - Falls back to searching for teacher IDs in raw text
 *
 * This dual approach ensures recommendations are returned even if the AI
 * doesn't follow the exact JSON format specified in the prompt.
 *
 * @param {string} aiResponse - Raw text response from Gemini
 * @param {Array} teachers - Teacher summaries to match IDs against
 * @returns {Object} { recommendedIds: string[], aiInsight: string }
 */
function parseAIResponse(aiResponse, teachers) {
  try {
    // Use regex to extract JSON object from response.
    // This handles cases where AI might include extra text before/after JSON.
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        recommendedIds: parsed.recommendedTeacherIds || [],
        aiInsight: parsed.insight || "",
      };
    }
  } catch (e) {
    // JSON parsing failed - this is expected sometimes with AI responses
    console.error("Failed to parse AI response:", e);
  }

  // Fallback: scan the raw response text for any teacher IDs.
  // This provides graceful degradation if AI doesn't return valid JSON.
  const teacherIds = teachers.map((t) => t.id);
  const foundIds = teacherIds.filter((id) => aiResponse.includes(id));

  return {
    recommendedIds: foundIds.slice(0, 5), // Limit to 5 even in fallback
    aiInsight: "", // No insight available in fallback mode
  };
}

/**
 * Provides rule-based fallback recommendations when Gemini AI is unavailable.
 *
 * This function implements a simple but effective matching algorithm:
 * 1. Filter teachers by budget compatibility
 * 2. If no matches, use all teachers (don't return empty results)
 * 3. Score teachers by combining rating (weighted heavily) and experience
 * 4. Sort by score descending to get best matches first
 *
 * The scoring formula: score = (rating * 20) + (lessonCount / 100)
 * - Rating (0-5) is multiplied by 20 to give range 0-100
 * - Lesson count is divided by 100 to add small bonus for experience
 * - This prioritizes rating while using experience as tiebreaker
 *
 * @param {Array} teachers - All active teachers from database
 * @param {Object} criteria - Student preferences for filtering
 * @param {string} criteria.skillLevel - Not used currently, reserved for future
 * @param {string} criteria.budget - 'low' | 'medium' | 'high'
 * @returns {Array} Top 5 matching teachers formatted for response
 */
function getFallbackRecommendations(teachers, { skillLevel, budget }) {
  let filtered = [...teachers]; // Clone to avoid mutating original

  // Apply budget filter based on standard lesson price
  if (budget === "low") {
    filtered = filtered.filter((t) => (t.prices?.standard || 25) < 20);
  } else if (budget === "medium") {
    filtered = filtered.filter((t) => {
      const price = t.prices?.standard || 25;
      return price >= 20 && price <= 40;
    });
  } else if (budget === "high") {
    filtered = filtered.filter((t) => (t.prices?.standard || 25) > 40);
  }

  // If budget filter eliminated all teachers, use full list
  // Better to show some results than none
  if (filtered.length === 0) {
    filtered = [...teachers];
  }

  // Sort by composite score: rating (primary) + experience (secondary)
  filtered.sort((a, b) => {
    const scoreA = (a.rating || 0) * 20 + (a.lessonCount || 0) / 100;
    const scoreB = (b.rating || 0) * 20 + (b.lessonCount || 0) / 100;
    return scoreB - scoreA;
  });

  return filtered.slice(0, 5).map((t) => ({
    id: t._id,
    name: t.name,
    tagline: t.tagline,
    bio: t.bio,
    avatar: t.avatar,
    rating: t.rating,
    lessonCount: t.lessonCount,
    prices: t.prices,
    skills: t.skills,
  }));
}

/**
 * GET /api/ai/questions
 *
 * Returns the questionnaire structure for the recommendation form
 */
router.get("/questions", (req, res) => {
  res.json({
    questions: [
      {
        id: "skillLevel",
        question: "What is your current skill level?",
        type: "single",
        options: [
          {
            value: "beginner",
            label: "Beginner",
            description: "Just starting out, need patient guidance",
          },
          {
            value: "intermediate",
            label: "Intermediate",
            description: "Have basics down, want to improve",
          },
          {
            value: "advanced",
            label: "Advanced",
            description: "Looking to master and refine skills",
          },
        ],
      },
      {
        id: "schedule",
        question: "When do you prefer to have lessons?",
        type: "single",
        options: [
          { value: "morning", label: "Morning", description: "6 AM - 12 PM" },
          {
            value: "afternoon",
            label: "Afternoon",
            description: "12 PM - 6 PM",
          },
          { value: "evening", label: "Evening", description: "6 PM - 10 PM" },
          {
            value: "weekend",
            label: "Weekends Only",
            description: "Saturday & Sunday",
          },
          {
            value: "flexible",
            label: "Flexible",
            description: "Any time works for me",
          },
        ],
      },
      {
        id: "learningStyle",
        question: "How do you prefer to learn?",
        type: "single",
        options: [
          {
            value: "structured",
            label: "Structured Lessons",
            description: "Clear curriculum with defined goals",
          },
          {
            value: "conversational",
            label: "Conversational Practice",
            description: "Learn through natural dialogue",
          },
          {
            value: "intensive",
            label: "Intensive Training",
            description: "Fast-paced, immersive learning",
          },
          {
            value: "flexible",
            label: "Flexible Approach",
            description: "Mix of methods based on my needs",
          },
        ],
      },
      {
        id: "budget",
        question: "What is your budget per lesson?",
        type: "single",
        options: [
          {
            value: "low",
            label: "Budget-Friendly",
            description: "Under $20/hour",
          },
          { value: "medium", label: "Moderate", description: "$20-40/hour" },
          { value: "high", label: "Premium", description: "$40+/hour" },
        ],
      },
      {
        id: "subject",
        question: "What would you like to learn?",
        type: "text",
        placeholder:
          "e.g., Business English, Interview Prep, Conversational...",
      },
      {
        id: "additionalInfo",
        question: "Anything else we should know? (Optional)",
        type: "textarea",
        placeholder:
          "Tell us about your goals, timeline, or specific requirements...",
      },
    ],
  });
});

export default router;
