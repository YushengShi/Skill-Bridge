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
        <div className="hero-image-wrapper">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop" 
            alt="Students learning together" 
            className="hero-image"
          />
        </div>
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
            <div className="feature-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop" 
                alt="AI Technology" 
                className="feature-image"
              />
            </div>
            <h3>🤖 AI Recommendations</h3>
            <p>Our smart system analyzes your goals to find the best match.</p>
          </div>
          <div className="feature-card">
            <div className="feature-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&auto=format&fit=crop" 
                alt="Calendar Scheduling" 
                className="feature-image"
              />
            </div>
            <h3>📅 Easy Scheduling</h3>
            <p>Book lessons seamlessly with real-time availability.</p>
          </div>
          <div className="feature-card">
            <div className="feature-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&auto=format&fit=crop" 
                alt="Expert Teacher" 
                className="feature-image"
              />
            </div>
            <h3>🎓 Expert Teachers</h3>
            <p>Verified professionals ready to help you succeed.</p>
          </div>
        </div>
      </section>

      <section className="roles-section">
        <div className="role-box student-side">
          <div className="role-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop" 
              alt="Student learning" 
              className="role-image"
            />
          </div>
          <div className="role-content">
            <h2>For Students</h2>
            <p>Master new skills and achieve your academic goals.</p>
          </div>
        </div>
        <div className="role-box teacher-side">
          <div className="role-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop" 
              alt="Teacher teaching" 
              className="role-image"
            />
          </div>
          <div className="role-content">
            <h2>For Teachers</h2>
            <p>Grow your business and manage students efficiently.</p>
          </div>
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