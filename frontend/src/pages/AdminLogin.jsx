import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../constants";
import "../components/Login.css";

export default function AdminLogin({ setIsAuthenticated, setUserRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setIsAuthenticated(true);
      setUserRole("admin");
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form
        className="login-form"
        onSubmit={handleLogin}
        style={{ borderTop: "5px solid #d32f2f" }}
      >
        <h2 style={{ color: "#d32f2f" }}>Admin Portal</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="login-btn"
          style={{ backgroundColor: "#d32f2f" }}
        >
          Login to Console
        </button>
      </form>
    </div>
  );
}
