import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <nav className="home-navbar">
        <div className="brand-logo">Skill Bridge</div>
        <div className="nav-buttons">
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login / Sign Up
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Find Your Perfect Tutor with us</h1>
          <p>
            Connect with expert teachers tailored to your learning style using our
            advanced AI matching algorithm.
          </p>
          <button className="cta-btn" onClick={() => navigate("/login")}>
            Get Started
          </button>
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🤖 AI Recommendations</h3>
            <p>Our smart system analyzes your goals to find the best match.</p>
          </div>
          <div className="feature-card">
            <h3>📅 Easy Scheduling</h3>
            <p>Book lessons seamlessly with real-time availability.</p>
          </div>
          <div className="feature-card">
            <h3>🎓 Expert Teachers</h3>
            <p>Verified professionals ready to help you succeed.</p>
          </div>
        </div>
      </section>

      <section className="roles-section">
        <div className="role-box student-side">
          <h2>For Students</h2>
          <p>Master new skills and achieve your academic goals.</p>
        </div>
        <div className="role-box teacher-side">
          <h2>For Teachers</h2>
          <p>Grow your business and manage students efficiently.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; 2025 Skill Bridge. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;