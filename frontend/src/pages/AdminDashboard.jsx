import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../constants";

export default function AdminDashboard({ setIsAuthenticated }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanToggle = async (userId, userType, currentStatus) => {
    const token = localStorage.getItem("token");
    if (
      !window.confirm(
        `Are you sure you want to ${currentStatus ? "Unban" : "Ban"} this user?`
      )
    )
      return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userType }),
      });

      if (res.ok) {
        // 更新本地列表状态
        setUsers(
          users.map((u) =>
            u._id === userId ? { ...u, isBanned: !u.isBanned } : u
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      navigate("/admin-login");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1>Admin Console</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Role</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "15px", textAlign: "left" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                style={{
                  borderBottom: "1px solid #eee",
                  background: user.isBanned ? "#fff0f0" : "white",
                }}
              >
                <td style={{ padding: "15px" }}>
                  {user.name || `${user.firstName} ${user.lastName}`}
                </td>
                <td style={{ padding: "15px" }}>{user.email}</td>
                <td style={{ padding: "15px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      background:
                        user.userType === "teacher" ? "#e3f2fd" : "#f3e5f5",
                      color:
                        user.userType === "teacher" ? "#1565c0" : "#7b1fa2",
                    }}
                  >
                    {user.userType.toUpperCase()}
                  </span>
                </td>
                <td
                  style={{
                    padding: "15px",
                    fontWeight: "bold",
                    color: user.isBanned ? "red" : "green",
                  }}
                >
                  {user.isBanned ? "BANNED" : "Active"}
                </td>
                <td style={{ padding: "15px" }}>
                  <button
                    onClick={() =>
                      handleBanToggle(user._id, user.userType, user.isBanned)
                    }
                    style={{
                      backgroundColor: user.isBanned ? "#4caf50" : "#f44336",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {user.isBanned ? "Unban" : "Ban User"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
