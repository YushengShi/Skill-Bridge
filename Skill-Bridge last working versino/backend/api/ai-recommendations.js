import { Router } from "express";
import Teacher from "../models/Teacher.js";
import Booking from "../models/Booking.js";
import { GoogleGenAI } from "@google/genai";
import protect from "../middleware/auth.js";

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
 * @returns {GoogleGenAI} Configured Gemini client instance
 */
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * @swagger
 * /api/ai/recommend:
 *   post:
 *     summary: Get AI-powered teacher recommendations
 *     description: |
 *       Takes student questionnaire answers and returns AI-powered teacher recommendations
 *       using Google Gemini API.
 *
 *       The AI analyzes student preferences including skill level, schedule, learning style,
 *       and budget to find the best matching teachers.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRecommendationRequest'
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIRecommendationResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *                 required:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["skillLevel", "schedule", "learningStyle", "budget"]
 *       404:
 *         description: No teachers available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No teachers available"
 *                 recommendations:
 *                   type: array
 *                   items: {}
 *       500:
 *         description: Server error or AI API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    // gemini-2.5-flash-lite is optimized for speed while maintaining good quality.
    const ai = getGeminiClient();

    // Send prompt to Gemini and await the response.
    // The AI will analyze teachers and return JSON with recommendations.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    const aiResponse = response.text;

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
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: AI chatbot for recommendations
 *     description: |
 *       AI Chatbot endpoint for conversational teacher recommendations.
 *       Maintains conversation context and extracts user preferences through natural dialogue.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's chat message
 *                 example: "I want to learn English for business"
 *               conversationHistory:
 *                 type: array
 *                 description: Previous messages for context
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *               extractedPreferences:
 *                 type: object
 *                 description: Preferences gathered from previous turns
 *     responses:
 *       200:
 *         description: Chatbot response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: AI's response message
 *                 extractedPreferences:
 *                   type: object
 *                   description: Updated preferences from conversation
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Teacher'
 *                 complete:
 *                   type: boolean
 *                   description: Whether enough info has been gathered
 *       400:
 *         description: Message is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/chat", async (req, res) => {
  try {
    // Extract request data with defaults for optional fields
    // - message: The user's current chat message (required)
    // - conversationHistory: Array of previous {role, content} messages for context
    // - extractedPreferences: Object holding preferences gathered in previous turns
    const {
      message,
      conversationHistory = [],
      extractedPreferences = {},
    } = req.body;

    // Validate that user sent a message
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Fetch all active teachers from DB, excluding password for security
    // These will be analyzed by AI to find the best matches
    const teachers = await Teacher.find({ isActive: true }).select("-password");

    // Transform MongoDB documents into plain objects for AI processing
    // Only include fields relevant for matching (not sensitive data)
    // Convert ObjectId to string for JSON serialization in AI prompt
    const teacherSummaries = teachers.map((teacher) => ({
      id: teacher._id.toString(),
      name: teacher.name,
      tagline: teacher.tagline || "",
      bio: teacher.bio || "",
      rating: teacher.rating,
      lessonCount: teacher.lessonCount,
      trialPrice: teacher.prices?.trial || 10,
      standardPrice: teacher.prices?.standard || 25,
      skills: teacher.skills || [],
      specializations: teacher.specializations || [],
      teachingStyle: teacher.teachingStyle || "",
      availability: teacher.availability || {},
      languages: teacher.languages || [],
    }));

    // Construct the AI prompt with conversation context, user preferences,
    // and available teachers for the AI to analyze
    const chatPrompt = buildChatbotPrompt({
      message,
      conversationHistory,
      extractedPreferences,
      teachers: teacherSummaries,
    });

    // Initialize Gemini client using API key from environment
    const ai = getGeminiClient();

    // Call Gemini API with the constructed prompt
    // Using gemini-2.5-flash-lite for fast responses with good quality
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: chatPrompt,
    });

    // Extract the text response from Gemini
    const aiResponse = response.text;

    // Parse AI's JSON response to extract:
    // - reply: The friendly message to show the user
    // - extractedPreferences: Any new preferences detected in user's message
    // - complete: Whether we have enough info to recommend teachers
    // - recommendations: Matched teachers (only if complete is true)
    const parsedResponse = parseChatbotResponse(
      aiResponse,
      teacherSummaries,
      teachers
    );

    // Send successful response with parsed AI data
    res.json({
      success: true,
      ...parsedResponse,
    });
  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error("AI Chatbot Error:", error);

    // Return a friendly fallback response instead of error
    // This ensures the chat continues even if AI temporarily fails
    // Preserve any preferences already gathered so user doesn't lose progress
    res.json({
      success: true,
      reply:
        "I'm having a bit of trouble right now. Could you tell me what kind of teacher you're looking for? I can help you find the perfect match based on your skill level, schedule, learning style, and budget!",
      extractedPreferences: req.body.extractedPreferences || {},
      complete: false,
    });
  }
});

/**
 * Builds the chatbot prompt for conversational teacher recommendations.
 *
 * @param {Object} params - Chat parameters
 * @param {string} params.message - Current user message
 * @param {Array} params.conversationHistory - Previous messages
 * @param {Object} params.extractedPreferences - Preferences gathered so far
 * @param {Array} params.teachers - Available teachers
 * @returns {string} Complete prompt for Gemini
 */
function buildChatbotPrompt({
  message,
  conversationHistory,
  extractedPreferences,
  teachers,
}) {
  // Format already-gathered preferences for the AI to reference
  // This helps AI know what info we still need to collect
  // If empty, tell AI no preferences gathered yet
  const preferencesInfo =
    Object.keys(extractedPreferences).length > 0
      ? `\nALREADY GATHERED PREFERENCES:\n${JSON.stringify(
          extractedPreferences,
          null,
          2
        )}`
      : "\nNo preferences gathered yet.";

  // Format conversation history so AI understands the dialogue context
  // Each message shows role (user/assistant) and content
  // This enables multi-turn conversations where AI remembers what was said
  const conversationContext =
    conversationHistory.length > 0
      ? `\nCONVERSATION HISTORY:\n${conversationHistory
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : "";

  return `You are a friendly AI assistant for SkillBridge, an online learning platform. Your job is to help students find the perfect teacher through a natural conversation.

YOUR PERSONALITY:
- Warm, helpful, and encouraging
- Ask one question at a time (don't overwhelm the user)
- Use emojis occasionally to be friendly 😊
- Keep responses concise (2-4 sentences max unless providing recommendations)

INFORMATION TO GATHER (in any order, naturally):
1. skillLevel: beginner, intermediate, or advanced
2. schedule: morning (6AM-12PM), afternoon (12PM-6PM), evening (6PM-10PM), weekend, or flexible
3. learningStyle: structured (clear curriculum), conversational (natural dialogue), intensive (fast-paced), or flexible
4. budget: low (under $20/hr), medium ($20-40/hr), or high ($40+/hr)
5. subject: What they want to learn (optional but helpful)
${preferencesInfo}
${conversationContext}

CURRENT USER MESSAGE: "${message}"

AVAILABLE TEACHERS:
${JSON.stringify(teachers.slice(0, 10), null, 2)}

TASK:
1. Respond naturally to the user's message
2. Extract any new preferences from their message
3. If missing info, ask about ONE thing naturally
4. When you have at least skillLevel, schedule, learningStyle, AND budget, provide teacher recommendations

RESPONSE FORMAT (JSON only):
{
  "reply": "Your friendly response to the user",
  "extractedPreferences": {
    "skillLevel": "beginner|intermediate|advanced" or null,
    "schedule": "morning|afternoon|evening|weekend|flexible" or null,
    "learningStyle": "structured|conversational|intensive|flexible" or null,
    "budget": "low|medium|high" or null,
    "subject": "string or null"
  },
  "complete": true/false (true if ready to recommend),
  "recommendedTeacherIds": ["id1", "id2", "id3"] (only if complete is true)
}

IMPORTANT:
- Merge new preferences with existing ones (don't reset to null if already known)
- Only return JSON, no additional text
- If the user greets you, greet them back and ask how you can help find their perfect teacher`;
}

/**
 * Parses the chatbot response from Gemini.
 *
 * @param {string} aiResponse - Raw response from Gemini
 * @param {Array} teacherSummaries - Teacher summaries for ID matching
 * @param {Array} fullTeachers - Full teacher documents
 * @returns {Object} Parsed chatbot response
 */
function parseChatbotResponse(aiResponse, teacherSummaries, fullTeachers) {
  try {
    // Use regex to extract JSON from AI response
    // This handles cases where AI might include extra text before/after the JSON
    // The regex matches everything between first { and last }
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Parse the extracted JSON string into an object
      const parsed = JSON.parse(jsonMatch[0]);

      // Build response object with safe defaults
      // - reply: The friendly message to display to user
      // - extractedPreferences: New preferences detected from user's message
      // - complete: Flag indicating if we have enough info to recommend
      const response = {
        reply: parsed.reply || "How can I help you find a teacher today?",
        extractedPreferences: parsed.extractedPreferences || {},
        complete: parsed.complete || false,
      };

      // If complete, include recommendations
      if (parsed.complete && parsed.recommendedTeacherIds) {
        const recommendedTeachers = fullTeachers
          .filter((t) =>
            parsed.recommendedTeacherIds.includes(t._id.toString())
          )
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

        // Fallback: If AI returned IDs that don't match any teachers,
        // provide top 3 teachers as a reasonable default
        // This ensures users always get some recommendations
        if (recommendedTeachers.length === 0 && fullTeachers.length > 0) {
          response.recommendations = fullTeachers
            .slice(0, 3)
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
            }));
        } else {
          // Use AI's recommended teachers, limited to top 5
          response.recommendations = recommendedTeachers.slice(0, 5);
        }
      }

      return response;
    }
  } catch (e) {
    // JSON parsing failed - log for debugging
    // This can happen if AI doesn't follow the expected format
    console.error("Failed to parse chatbot response:", e);
  }

  // Ultimate fallback: If JSON parsing fails entirely,
  // return a friendly message to keep the conversation going
  // Reset preferences to empty so AI starts fresh gathering info
  return {
    reply:
      "I'd love to help you find a great teacher! What subject are you interested in learning?",
    extractedPreferences: {},
    complete: false,
  };
}

/**
 * @swagger
 * /api/ai/questions:
 *   get:
 *     summary: Get recommendation questionnaire
 *     description: Returns the questionnaire structure for the recommendation form with all available options.
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Questionnaire structure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "skillLevel"
 *                       question:
 *                         type: string
 *                         example: "What is your current skill level?"
 *                       type:
 *                         type: string
 *                         enum: [single, text]
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                             label:
 *                               type: string
 *                             description:
 *                               type: string
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

/**
 * @swagger
 * /api/ai/teacher-chat:
 *   post:
 *     summary: AI chatbot for teachers
 *     description: |
 *       AI Chatbot endpoint for teachers to get assistance with:
 *       - Upcoming bookings and schedule
 *       - Availability management
 *       - Earnings overview
 *       - Teaching-related questions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Teacher's chat message
 *                 example: "What are my upcoming lessons?"
 *               conversationHistory:
 *                 type: array
 *                 description: Previous messages for context
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chatbot response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: AI's response message
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Message is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: This endpoint is for teachers only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/teacher-chat", protect, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validate that user sent a message
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Verify the user is a teacher
    if (req.userRole !== "teacher") {
      return res
        .status(403)
        .json({ error: "This endpoint is for teachers only" });
    }

    const teacherId = req.userId;

    // Fetch teacher's data for context
    const teacher = await Teacher.findById(teacherId).select("-password");
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Fetch teacher's bookings for context
    const bookings = await Booking.find({ teacherId })
      .populate("studentId", "name email")
      .sort({ scheduledDate: 1 })
      .limit(20);

    // Separate bookings by status
    const now = new Date();
    const upcomingBookings = bookings.filter(
      (b) =>
        b.scheduledDate &&
        new Date(b.scheduledDate) >= now &&
        b.status === "confirmed"
    );
    const pendingBookings = bookings.filter((b) => b.status === "pending");
    const completedBookings = bookings.filter((b) => b.status === "completed");

    // Calculate earnings summary
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = bookings
      .filter(
        (b) =>
          b.status === "completed" &&
          b.scheduledDate &&
          new Date(b.scheduledDate) >= thisMonthStart
      )
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const totalEarnings = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // Build context for the AI
    const teacherContext = {
      name: teacher.name,
      subject: teacher.tagline || "General",
      rating: teacher.rating,
      totalLessons: teacher.lessonCount,
      totalStudents: teacher.studentsCount,
      prices: teacher.prices,
      availability: teacher.availability,
      upcomingBookings: upcomingBookings.slice(0, 5).map((b) => ({
        studentName: b.studentId?.name || "Unknown Student",
        date: b.scheduledDate,
        time: b.scheduledTime,
        lessonType: b.lessonType,
        amount: b.amount,
      })),
      pendingBookingsCount: pendingBookings.length,
      pendingBookings: pendingBookings.slice(0, 5).map((b) => ({
        studentName: b.studentId?.name || "Unknown Student",
        date: b.scheduledDate,
        time: b.scheduledTime,
        lessonType: b.lessonType,
        message: b.message,
      })),
      thisMonthEarnings,
      totalEarnings,
      completedLessonsCount: completedBookings.length,
    };

    // Build the prompt for the teacher assistant
    const chatPrompt = buildTeacherChatPrompt({
      message,
      conversationHistory,
      teacherContext,
    });

    // Initialize Gemini client
    const ai = getGeminiClient();

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: chatPrompt,
    });

    const aiResponse = response.text;

    // Parse the response
    const parsedResponse = parseTeacherChatResponse(aiResponse);

    res.json({
      success: true,
      ...parsedResponse,
    });
  } catch (error) {
    console.error("Teacher AI Chatbot Error:", error);

    // Return a friendly fallback response
    res.json({
      success: true,
      reply:
        "I'm having a bit of trouble right now. You can ask me about your upcoming bookings, availability, earnings, or any teaching-related questions. Please try again!",
    });
  }
});

/**
 * Builds the chatbot prompt for teacher assistance.
 *
 * @param {Object} params - Chat parameters
 * @param {string} params.message - Current teacher message
 * @param {Array} params.conversationHistory - Previous messages
 * @param {Object} params.teacherContext - Teacher's data and bookings
 * @returns {string} Complete prompt for Gemini
 */
function buildTeacherChatPrompt({
  message,
  conversationHistory,
  teacherContext,
}) {
  const conversationContext =
    conversationHistory.length > 0
      ? `\nCONVERSATION HISTORY:\n${conversationHistory
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : "";

  const upcomingBookingsInfo =
    teacherContext.upcomingBookings.length > 0
      ? teacherContext.upcomingBookings
          .map(
            (b) =>
              `- ${b.studentName} on ${new Date(
                b.date
              ).toLocaleDateString()} at ${b.time || "TBD"} (${
                b.lessonType
              }, $${b.amount})`
          )
          .join("\n")
      : "No upcoming bookings scheduled.";

  const pendingBookingsInfo =
    teacherContext.pendingBookings.length > 0
      ? teacherContext.pendingBookings
          .map(
            (b) =>
              `- ${b.studentName} requesting ${
                b.date ? new Date(b.date).toLocaleDateString() : "date TBD"
              } at ${b.time || "TBD"} (${b.lessonType})${
                b.message ? ` - Note: "${b.message}"` : ""
              }`
          )
          .join("\n")
      : "No pending booking requests.";

  return `You are a helpful AI teaching assistant for SkillBridge, an online learning platform. You're helping a teacher manage their teaching activities.

YOUR PERSONALITY:
- Professional, supportive, and encouraging
- Provide concise but helpful answers
- Use emojis occasionally to be friendly 📚
- Be proactive in offering relevant suggestions

TEACHER INFORMATION:
- Name: ${teacherContext.name}
- Subject/Specialty: ${teacherContext.subject}
- Rating: ${teacherContext.rating}/5 stars
- Total Lessons Taught: ${teacherContext.totalLessons}
- Total Students: ${teacherContext.totalStudents}
- Lesson Prices: Trial $${teacherContext.prices?.trial || 15}, Standard $${
    teacherContext.prices?.standard || 30
  }

UPCOMING CONFIRMED BOOKINGS:
${upcomingBookingsInfo}

PENDING BOOKING REQUESTS (${teacherContext.pendingBookingsCount} total):
${pendingBookingsInfo}

EARNINGS:
- This Month: $${teacherContext.thisMonthEarnings}
- Total Earnings: $${teacherContext.totalEarnings}
- Completed Lessons: ${teacherContext.completedLessonsCount}

AVAILABILITY (if set):
${
  teacherContext.availability
    ? JSON.stringify(teacherContext.availability, null, 2)
    : "Not configured yet"
}
${conversationContext}

CURRENT TEACHER MESSAGE: "${message}"

TASK:
Respond helpfully to the teacher's question or request. You can help with:
1. Upcoming bookings and schedule information
2. Pending booking requests that need approval
3. Earnings overview and payment information
4. Availability management tips
5. Teaching tips and best practices
6. Platform usage guidance

RESPONSE FORMAT (JSON only):
{
  "reply": "Your helpful response to the teacher"
}

IMPORTANT:
- Be specific when discussing bookings - mention student names and dates when relevant
- If the teacher asks about something not in the context, provide general helpful advice
- Keep responses concise but informative (2-5 sentences unless more detail is needed)
- Only return JSON, no additional text`;
}

/**
 * Parses the teacher chatbot response from Gemini.
 *
 * @param {string} aiResponse - Raw response from Gemini
 * @returns {Object} Parsed chatbot response
 */
function parseTeacherChatResponse(aiResponse) {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reply: parsed.reply || "How can I help you with your teaching today?",
      };
    }
  } catch (e) {
    console.error("Failed to parse teacher chatbot response:", e);
  }

  // Fallback: return the raw response if JSON parsing fails
  // Sometimes the AI might return a plain text response
  if (aiResponse && aiResponse.trim()) {
    return {
      reply: aiResponse.trim(),
    };
  }

  return {
    reply:
      "How can I help you with your teaching today? You can ask me about your upcoming bookings, earnings, or availability.",
  };
}

export default router;
