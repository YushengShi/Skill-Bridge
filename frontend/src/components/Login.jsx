import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Login.css";

function Login({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();

  const [uiRole, setUiRole] = useState("student"); // 'student' | 'teacher'

  const [isSignupMode, setIsSignupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
    // Auto-focus on email field when page loads
    const emailInput = document.getElementById("email");
    if (emailInput && !isSignupMode) {
      emailInput.focus();
    }
  }, [uiRole, isSignupMode]);

  // Password toggle functions
  const togglePassword = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else if (field === "signupPassword") {
      setShowSignupPassword(!showSignupPassword);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Social login handlers
  const handleSocialLogin = (provider) => {
    if (provider === "google") {
      // Redirect to Google OAuth with role parameter
      const role = uiRole; // 'student' or 'teacher'
      window.location.href = `/api/auth/google?role=${role}`;
    } else if (provider === "microsoft") {
      setErrorMessage("Microsoft login coming soon!");
    }
  };

  // Forgot password handler
  const handleForgotPassword = () => {
    if (!email) {
      setErrorMessage("Please enter your email address first.");
      return;
    }
    setSuccessMessage("Password reset instructions sent to your email.");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Validate confirm password for signup
    if (isSignupMode && password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const baseUrl = "/api";
    const rolePath = uiRole === "student" ? "students" : "teachers";

    // if student register：POST /api/students
    // if teacher register：POST /api/teachers/register
    // if login：POST /api/xxx/login
    let url = "";
    if (isSignupMode) {
      url =
        uiRole === "student"
          ? `${baseUrl}/students`
          : `${baseUrl}/teachers/register`;
    } else {
      url = `${baseUrl}/${rolePath}/login`;
    }

    // 2. 构建请求体
    const payload = { email, password };

    // 只有注册时才需要额外字段
    if (isSignupMode) {
      if (uiRole === "student") {
        payload.firstName = firstName;
        payload.lastName = lastName;
      } else {
        payload.name = teacherName;
      }
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send session cookie
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (isSignupMode) {
        setSuccessMessage("Account created successfully! Please log in.");
        setIsLoading(false);
        // Clear signup form
        setConfirmPassword("");
        setAgreeTerms(false);
        // Wait 1 second before switching to login form
        setTimeout(() => {
          setIsSignupMode(false);
          setSuccessMessage("");
        }, 1000);
      } else {
        // Store remembered email if checkbox is checked
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        }
        // Store authentication data in localStorage for persistence across refreshes
        localStorage.setItem("token", data.token); // JWT for API auth
        localStorage.setItem("user", JSON.stringify(data.user)); // User profile data

        setSuccessMessage("Login successful! Redirecting...");
        setIsLoading(false);

        try {
          // Decode JWT to extract user role for routing decisions
          const decoded = jwtDecode(data.token);
          setUserRole(decoded.role); // Update app-wide role state
          setIsAuthenticated(true); // Update app-wide auth state

          // Wait 0.5-1 second before navigation to show success message
          setTimeout(() => {
            // Route users to their role-specific dashboard after login
            // Teachers go to teacher dashboard, students go to student dashboard
            if (decoded.role === "teacher") {
              navigate("/teacher-dashboard");
            } else {
              navigate("/student-dashboard");
            }
          }, 800);
        } catch (decodeError) {
          console.error("Token decode failed", decodeError);
          setErrorMessage("Login failed: Invalid token received.");
          setIsLoading(false);
        }
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-wrapper ${uiRole}-theme`}>
      <div className="login-container">
        <div className="role-toggle-container">
          <button
            type="button"
            className={`role-toggle-btn${
              uiRole === "student" ? " selected" : ""
            }`}
            onClick={() => setUiRole("student")}
            style={
              uiRole === "student"
                ? {
                    background: "var(--primary-color)",
                    color: "#fff",
                  }
                : {}
            }
          >
            Student
          </button>
          <button
            type="button"
            className={`role-toggle-btn${
              uiRole === "teacher" ? " selected" : ""
            }`}
            onClick={() => setUiRole("teacher")}
            style={
              uiRole === "teacher"
                ? {
                    background: "var(--primary-color)",
                    color: "#fff",
                  }
                : {}
            }
          >
            Teacher
          </button>
        </div>

        <div className="login-header">
          <h1 className="login-title">Skill Bridge</h1>
          <p className="login-subtitle">
            {isSignupMode ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {/* Login Form */}
        <form
          id="loginForm"
          onSubmit={handleAuth}
          style={{ display: isSignupMode ? "none" : "block" }}
        >
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePassword("password")}
              >
                <img
                  src={
                    showPassword
                      ? "https://cdn-icons-png.flaticon.com/128/2767/2767146.png"
                      : "https://cdn-icons-png.flaticon.com/128/2767/2767194.png"
                  }
                  alt="Toggle password"
                  style={{ width: "20px", height: "20px" }}
                />
              </button>
            </div>
          </div>

          <div className="remember-forgot">
            <label className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <a
              href="#"
              className="forgot-password"
              onClick={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}
            >
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            <div className={`loading ${isLoading ? "" : "hidden"}`}></div>
            <span>{isLoading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>

        {/* Signup Form */}
        <form
          id="signupForm"
          onSubmit={handleAuth}
          style={{ display: isSignupMode ? "block" : "none" }}
        >
          {uiRole === "student" ? (
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="form-input"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="form-input"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="teacherName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="teacherName"
                className="form-input"
                placeholder="Enter your full name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="signupEmail" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="signupEmail"
              name="signupEmail"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signupPassword" className="form-label">
              Password
            </label>
            <div className="password-container">
              <input
                type={showSignupPassword ? "text" : "password"}
                id="signupPassword"
                name="signupPassword"
                className="form-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePassword("signupPassword")}
              >
                <img
                  src={
                    showSignupPassword
                      ? "https://cdn-icons-png.flaticon.com/128/2767/2767146.png"
                      : "https://cdn-icons-png.flaticon.com/128/2767/2767194.png"
                  }
                  alt="Toggle password"
                  style={{ width: "20px", height: "20px" }}
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <div className="password-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePassword("confirmPassword")}
              >
                <img
                  src={
                    showConfirmPassword
                      ? "https://cdn-icons-png.flaticon.com/128/2767/2767146.png"
                      : "https://cdn-icons-png.flaticon.com/128/2767/2767194.png"
                  }
                  alt="Toggle password"
                  style={{ width: "20px", height: "20px" }}
                />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="terms-checkbox">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            <div className={`loading ${isLoading ? "" : "hidden"}`}></div>
            <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <div className="social-login">
          <a
            href="#"
            className="social-button"
            onClick={(e) => {
              e.preventDefault();
              handleSocialLogin("google");
            }}
          >
            <img
              src="https://img.icons8.com/?size=100&id=17950&format=png"
              alt="Google"
              style={{ width: "20px", height: "20px" }}
            />
            Google
          </a>
          <a
            href="#"
            className="social-button"
            onClick={(e) => {
              e.preventDefault();
              handleSocialLogin("microsoft");
            }}
          >
            <img
              src="https://img.icons8.com/?size=100&id=22984&format=png"
              alt="Microsoft"
              style={{ width: "20px", height: "20px" }}
            />
            Microsoft
          </a>
        </div>

        <div className="signup-link">
          <span>
            {isSignupMode
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsSignupMode(!isSignupMode);
            }}
          >
            {isSignupMode ? "Sign in here" : "Sign up here"}
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
