import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AIChatbot.css";

/**
 * ================================================================================
 * AI CHATBOT COMPONENT
 * ================================================================================
 *
 * PURPOSE:
 * Provides a conversational AI interface for finding the perfect teacher.
 * Users can chat naturally with the AI which gathers preferences and
 * recommends matching teachers.
 *
 * FEATURES:
 * - Natural conversation interface
 * - Collects: skill level, schedule, learning style, budget
 * - AI-powered teacher recommendations via Google Gemini
 * - Floating chat widget that can be opened/closed
 *
 * @component
 */
export default function AIChatbot({ isOpen, onClose, isFloating = true }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ==================== STATE MANAGEMENT ====================

  // Chat messages array
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! 👋 I'm your AI assistant. I'll help you find the perfect teacher based on your preferences. What would you like to learn?",
    },
  ]);

  // Current input text
  const [inputValue, setInputValue] = useState("");

  // Loading state while waiting for AI response
  const [isLoading, setIsLoading] = useState(false);

  // Extracted preferences from conversation
  const [preferences, setPreferences] = useState({});

  // Teacher recommendations (when complete)
  const [recommendations, setRecommendations] = useState(null);

  // ==================== EFFECTS ====================

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // ==================== HANDLERS ====================

  /**
   * Sends a message to the AI chatbot endpoint
   */
  const handleSendMessage = async () => {
    // Trim whitespace and validate input
    const message = inputValue.trim();

    // Prevent sending empty messages or double-sending while loading
    if (!message || isLoading) return;

    // Immediately add user's message to chat UI for instant feedback
    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input field and show loading state
    setInputValue("");
    setIsLoading(true);

    try {
      // Get auth token for authenticated requests (optional but enables personalization)
      const token = localStorage.getItem("token");

      // Build conversation history array for AI context
      // This allows AI to understand the full dialogue and maintain coherence
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Send chat request to backend AI endpoint
      const response = await fetch("http://localhost:3000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Conditionally add auth header if token exists
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message, // Current user message
          conversationHistory, // Previous messages for context
          extractedPreferences: preferences, // Preferences gathered so far
        }),
      });

      const data = await response.json();

      // Merge newly extracted preferences with existing ones
      // Filter out null values to avoid overwriting valid preferences
      // This accumulates preferences across multiple conversation turns
      if (data.extractedPreferences) {
        setPreferences((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data.extractedPreferences).filter(
              ([_, v]) => v !== null
            )
          ),
        }));
      }

      // Add AI's response to the chat messages
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      // Check if AI has gathered enough preferences to recommend teachers
      // If complete=true, display the teacher recommendation cards
      if (data.complete && data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      // Log error for debugging and show friendly error message to user
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again! 🙏",
        },
      ]);
    } finally {
      // Always hide loading state, whether success or error
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key to send message
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Reset chat to start over
   */
  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Let's start fresh! 🔄 What would you like to learn today?",
      },
    ]);
    setPreferences({});
    setRecommendations(null);
    setInputValue("");
  };

  /**
   * Navigate to teacher profile
   */
  const handleViewTeacher = (teacherId) => {
    navigate(`/teachers/${teacherId}`);
    if (onClose) onClose();
  };

  /**
   * Navigate to booking page
   */
  const handleBookTeacher = (teacherId) => {
    navigate(`/booking/${teacherId}`);
    if (onClose) onClose();
  };

  // ==================== RENDER HELPERS ====================

  /**
   * Renders the preference pills showing what's been gathered
   */
  const renderPreferencePills = () => {
    const prefs = Object.entries(preferences).filter(([_, v]) => v);
    if (prefs.length === 0) return null;

    const labels = {
      skillLevel: "Level",
      schedule: "Schedule",
      learningStyle: "Style",
      budget: "Budget",
      subject: "Subject",
    };

    return (
      <div className="preference-pills">
        {prefs.map(([key, value]) => (
          <span key={key} className="pref-pill">
            {labels[key] || key}: {value}
          </span>
        ))}
      </div>
    );
  };

  /**
   * Renders a single chat message
   */
  const renderMessage = (message, index) => (
    <div
      key={index}
      className={`chat-message ${
        message.role === "user" ? "user" : "assistant"
      }`}
    >
      {message.role === "assistant" && <div className="avatar">🤖</div>}
      <div className="message-content">
        <p>{message.content}</p>
      </div>
      {message.role === "user" && <div className="avatar user-avatar">👤</div>}
    </div>
  );

  /**
   * Renders teacher recommendation cards
   */
  const renderRecommendations = () => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="chat-recommendations">
        <h3>✨ Here are your personalized recommendations:</h3>
        <div className="rec-cards">
          {recommendations.map((teacher, index) => (
            <div key={teacher.id || index} className="rec-card">
              <div className="rec-card-header">
                <img
                  src={
                    teacher.avatar ||
                    `https://i.pravatar.cc/150?img=${index + 10}`
                  }
                  alt={teacher.name}
                  className="rec-avatar"
                />
                <div className="rec-info">
                  <h4>{teacher.name}</h4>
                  <p className="rec-tagline">{teacher.tagline}</p>
                </div>
                <span className="rec-match">#{index + 1}</span>
              </div>
              <div className="rec-meta">
                <span>⭐ {teacher.rating?.toFixed(1) || "5.0"}</span>
                <span>📚 {teacher.lessonCount || 0} lessons</span>
                <span>💰 ${teacher.prices?.standard || 25}/hr</span>
              </div>
              {teacher.skills?.length > 0 && (
                <div className="rec-skills">
                  {teacher.skills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="rec-skill">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <div className="rec-actions">
                <button
                  className="rec-btn secondary"
                  onClick={() => handleViewTeacher(teacher.id)}
                >
                  View Profile
                </button>
                <button
                  className="rec-btn primary"
                  onClick={() => handleBookTeacher(teacher.id)}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="start-over-btn" onClick={handleReset}>
          🔄 Start New Search
        </button>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  // Floating chat widget wrapper
  if (isFloating) {
    return (
      <>
        {isOpen && <div className="chatbot-overlay" onClick={onClose} />}
        <div className={`chatbot-container floating ${isOpen ? "open" : ""}`}>
          {/* Chat Header */}
          <div className="chatbot-header">
            <div className="header-info">
              <span className="bot-icon">🤖</span>
              <div>
                <h3>AI Teacher Finder</h3>
                <span className="status">
                  <span className="status-dot"></span> Online
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Preference Pills */}
          {renderPreferencePills()}

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map(renderMessage)}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="avatar">🤖</div>
                <div className="message-content typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {renderRecommendations()}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              ➤
            </button>
          </div>
        </div>
      </>
    );
  }

  // Full-page chat (non-floating)
  return (
    <div className="chatbot-page">
      <div className="chatbot-container full-page">
        {/* Chat Header */}
        <div className="chatbot-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="header-info">
            <span className="bot-icon">🤖</span>
            <div>
              <h3>AI Teacher Finder</h3>
              <span className="status">
                <span className="status-dot"></span> Online
              </span>
            </div>
          </div>
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        {/* Preference Pills */}
        {renderPreferencePills()}

        {/* Messages Area */}
        <div className="chatbot-messages">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="avatar">🤖</div>
              <div className="message-content typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          {renderRecommendations()}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chatbot-input">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating chat button component
 */
export function ChatbotButton({ onClick, isOpen }) {
  return (
    <button
      className={`chatbot-fab ${isOpen ? "active" : ""}`}
      onClick={onClick}
      aria-label="Open AI Chat"
    >
      {isOpen ? "✕" : "🤖"}
    </button>
  );
}
