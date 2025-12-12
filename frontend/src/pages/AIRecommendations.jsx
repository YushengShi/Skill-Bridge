import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AIRecommendations.css";

/**
 * ================================================================================
 * AI RECOMMENDATIONS COMPONENT
 * ================================================================================
 *
 * PURPOSE:
 * Provides an interactive questionnaire that collects student preferences
 * and uses Google Gemini AI to recommend the best matching teachers.
 *
 * FEATURES:
 * - Multi-step questionnaire with progress indicator
 * - Skill level, schedule, learning style, budget questions
 * - AI-powered teacher recommendations
 * - Fallback recommendations if AI is unavailable
 *
 * ROUTE: /ai-recommendations (protected - requires authentication)
 *
 * @component
 */
export default function AIRecommendations() {
  const navigate = useNavigate();

  // ==================== STATE MANAGEMENT ====================

  // Current step in the questionnaire (0-indexed)
  const [currentStep, setCurrentStep] = useState(0);

  // Questions fetched from the backend
  const [questions, setQuestions] = useState([]);

  // User's answers to each question
  const [answers, setAnswers] = useState({});

  // Loading states
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Recommended teachers from AI
  const [recommendations, setRecommendations] = useState(null);

  // AI insight message
  const [aiInsight, setAiInsight] = useState("");

  // Error state
  const [error, setError] = useState(null);

  // ==================== DATA FETCHING ====================

  /**
   * Fetches the questionnaire questions from the backend
   */
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/ai/questions");
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        setQuestions(data.questions);
      } catch (err) {
        console.error("Error fetching questions:", err);
        // Use default questions if API fails
        setQuestions(getDefaultQuestions());
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  /**
   * Default questions in case API is unavailable
   */
  const getDefaultQuestions = () => [
    {
      id: "skillLevel",
      question: "What is your current skill level?",
      type: "single",
      options: [
        {
          value: "beginner",
          label: "Beginner",
          description: "Just starting out",
        },
        {
          value: "intermediate",
          label: "Intermediate",
          description: "Have basics down",
        },
        {
          value: "advanced",
          label: "Advanced",
          description: "Looking to master skills",
        },
      ],
    },
    {
      id: "schedule",
      question: "When do you prefer to have lessons?",
      type: "single",
      options: [
        { value: "morning", label: "Morning", description: "6 AM - 12 PM" },
        { value: "afternoon", label: "Afternoon", description: "12 PM - 6 PM" },
        { value: "evening", label: "Evening", description: "6 PM - 10 PM" },
        {
          value: "weekend",
          label: "Weekends",
          description: "Saturday & Sunday",
        },
        { value: "flexible", label: "Flexible", description: "Any time works" },
      ],
    },
    {
      id: "learningStyle",
      question: "How do you prefer to learn?",
      type: "single",
      options: [
        {
          value: "structured",
          label: "Structured",
          description: "Clear curriculum",
        },
        {
          value: "conversational",
          label: "Conversational",
          description: "Natural dialogue",
        },
        {
          value: "intensive",
          label: "Intensive",
          description: "Fast-paced learning",
        },
        { value: "flexible", label: "Flexible", description: "Mix of methods" },
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
      placeholder: "e.g., Business English, Interview Prep...",
    },
  ];

  // ==================== EVENT HANDLERS ====================

  /**
   * Handles selecting an option for single-choice questions
   */
  const handleOptionSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  /**
   * Handles text input for text/textarea questions
   */
  const handleTextInput = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  /**
   * Moves to the next question
   */
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  /**
   * Moves to the previous question
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  /**
   * Submits questionnaire answers to the backend AI endpoint.
   *
   * Flow:
   * 1. Show loading state to prevent double-submission
   * 2. Include auth token if available (allows personalized recommendations)
   * 3. POST answers as JSON to /api/ai/recommend
   * 4. On success: display recommendations and AI insight
   * 5. On failure: show error message, allow retry
   */
  const handleSubmit = async () => {
    setLoadingRecommendations(true);
    setError(null);

    try {
      // Get token for authenticated requests (optional but enables personalization)
      const token = localStorage.getItem("token");

      // Send answers to AI recommendation endpoint
      const response = await fetch("http://localhost:3000/api/ai/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Conditionally add auth header if token exists
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(answers), // Send all collected answers
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      // Extract recommendations and AI insight from response
      const data = await response.json();
      setRecommendations(data.recommendations); // Array of matched teachers
      setAiInsight(data.aiInsight); // Personalized explanation from AI
    } catch (err) {
      console.error("Error getting recommendations:", err);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      // Always hide loading state, even on error
      setLoadingRecommendations(false);
    }
  };

  /**
   * Resets the questionnaire to start over
   */
  const handleStartOver = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendations(null);
    setAiInsight("");
    setError(null);
  };

  // ==================== RENDER HELPERS ====================

  /**
   * Validates if the current question has been answered.
   * Used to enable/disable the "Next" button.
   *
   * Logic:
   * - Text/textarea fields are always considered "answered" (optional)
   * - Single-choice questions require a selection
   *
   * @returns {boolean} True if user can proceed to next question
   */
  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion) return false;

    const answer = answers[currentQuestion.id];
    // Text inputs are optional - user can skip with Next
    if (
      currentQuestion.type === "text" ||
      currentQuestion.type === "textarea"
    ) {
      return true;
    }
    // For single-choice, must have a non-empty selection
    return answer !== undefined && answer !== "";
  };

  /**
   * Validates if all required questions have been answered.
   * Used to enable/disable the final "Get Recommendations" button.
   *
   * Required fields: skillLevel, schedule, learningStyle, budget
   * Optional fields: subject, additionalInfo
   *
   * @returns {boolean} True if user can submit for AI recommendations
   */
  const areRequiredQuestionsAnswered = () => {
    // These four fields are essential for AI matching
    const requiredIds = ["skillLevel", "schedule", "learningStyle", "budget"];
    // Check that each required field has a value in answers object
    return requiredIds.every((id) => answers[id]);
  };

  // ==================== LOADING STATE ====================

  if (loadingQuestions) {
    return (
      <div className="ai-recommendations">
        <div className="ai-loading">
          <div className="spinner"></div>
          <p>Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  // ==================== RESULTS VIEW ====================

  if (recommendations) {
    return (
      <div className="ai-recommendations">
        <div className="ai-container">
          <header className="ai-header">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1>🤖 AI Recommendations</h1>
          </header>

          <div className="results-container">
            {/* AI Insight Card */}
            <div className="ai-insight-card">
              <div className="insight-icon">✨</div>
              <div className="insight-content">
                <h3>AI Analysis</h3>
                <p>{aiInsight}</p>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="recommendations-grid">
              <h2>Recommended Teachers for You</h2>
              {recommendations.length > 0 ? (
                <div className="teacher-cards">
                  {recommendations.map((teacher, index) => (
                    <div key={teacher.id || index} className="teacher-rec-card">
                      <div className="match-badge">#{index + 1} Match</div>
                      <img
                        src={
                          teacher.avatar ||
                          `https://i.pravatar.cc/150?img=${index + 1}`
                        }
                        alt={teacher.name}
                        className="teacher-avatar"
                      />
                      <div className="teacher-info">
                        <h3>{teacher.name}</h3>
                        <p className="tagline">{teacher.tagline}</p>
                        <p className="bio">
                          {teacher.bio?.substring(0, 100)}...
                        </p>
                        <div className="teacher-meta">
                          <span className="rating">
                            ⭐ {teacher.rating?.toFixed(1) || "5.0"}
                          </span>
                          <span className="lessons">
                            📚 {teacher.lessonCount || 0} lessons
                          </span>
                          <span className="price">
                            💰 ${teacher.prices?.standard || 25}/hr
                          </span>
                        </div>
                        {teacher.skills?.length > 0 && (
                          <div className="teacher-skills">
                            {teacher.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="skill-tag">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="teacher-actions">
                        <button
                          className="view-profile-btn"
                          onClick={() => navigate(`/teachers/${teacher.id}`)}
                        >
                          View Profile
                        </button>
                        <button
                          className="book-btn"
                          onClick={() => navigate(`/booking/${teacher.id}`)}
                        >
                          Book Lesson
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-recommendations">
                  <p>
                    No matching teachers found. Try adjusting your preferences.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="results-actions">
              <button className="secondary-btn" onClick={handleStartOver}>
                Start Over
              </button>
              <button
                className="primary-btn"
                onClick={() => navigate("/teachers")}
              >
                Browse All Teachers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== QUESTIONNAIRE VIEW ====================

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="ai-recommendations">
      <div className="ai-container">
        {/* Header */}
        <header className="ai-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>🤖 Find Your Perfect Teacher</h1>
          <p className="subtitle">
            Answer a few questions and let our AI recommend the best teachers
            for you
          </p>
        </header>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Question {currentStep + 1} of {questions.length}
          </span>
        </div>

        {/* Question Card */}
        <div className="question-card">
          <h2>{currentQuestion?.question}</h2>

          {/* Single Choice Options */}
          {currentQuestion?.type === "single" && (
            <div className="options-grid">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  className={`option-card ${
                    answers[currentQuestion.id] === option.value
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleOptionSelect(currentQuestion.id, option.value)
                  }
                >
                  <span className="option-label">{option.label}</span>
                  <span className="option-description">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Text Input */}
          {currentQuestion?.type === "text" && (
            <input
              type="text"
              className="text-input"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                handleTextInput(currentQuestion.id, e.target.value)
              }
            />
          )}

          {/* Textarea Input */}
          {currentQuestion?.type === "textarea" && (
            <textarea
              className="textarea-input"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                handleTextInput(currentQuestion.id, e.target.value)
              }
              rows={4}
            />
          )}
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Navigation Buttons */}
        <div className="navigation-buttons">
          <button
            className="nav-btn back"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            ← Back
          </button>

          {currentStep < questions.length - 1 ? (
            <button
              className="nav-btn next"
              onClick={handleNext}
              disabled={
                currentQuestion?.type === "single" &&
                !isCurrentQuestionAnswered()
              }
            >
              Next →
            </button>
          ) : (
            <button
              className="nav-btn submit"
              onClick={handleSubmit}
              disabled={
                !areRequiredQuestionsAnswered() || loadingRecommendations
              }
            >
              {loadingRecommendations ? (
                <>
                  <span className="btn-spinner"></span>
                  Finding Teachers...
                </>
              ) : (
                "Get Recommendations 🚀"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
