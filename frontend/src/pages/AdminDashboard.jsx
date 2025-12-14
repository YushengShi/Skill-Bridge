import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../constants";

export default function AdminDashboard({ setIsAuthenticated }) {
  const [users, setUsers] = useState([]);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const handleEditClick = (teacher) => {
    if (teacher.userType !== "teacher") return;
    setEditingTeacher(teacher);
    setEditForm({
      name: teacher.name || "",
      email: teacher.email || "",
    });
    setPreviewUrl(teacher.avatar || null);
    setSelectedFile(null);
  };

  const handleCloseEdit = () => {
    setEditingTeacher(null);
    setEditForm({ name: "", email: "" });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const res = await fetch(
        `${API_BASE_URL}/api/admin/teachers/${editingTeacher._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update teacher");
      }

      const updatedTeacher = await res.json();
      
      // Update the users list
      setUsers(
        users.map((u) =>
          u._id === editingTeacher._id
            ? { ...u, name: updatedTeacher.name, email: updatedTeacher.email, avatar: updatedTeacher.avatar }
            : u
        )
      );

      handleCloseEdit();
      alert("Teacher updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update teacher: " + error.message);
    } finally {
      setLoading(false);
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
                  <div style={{ display: "flex", gap: "8px" }}>
                    {user.userType === "teacher" && (
                      <button
                        onClick={() => handleEditClick(user)}
                        style={{
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Edit
                      </button>
                    )}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseEdit}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
              Edit Teacher: {editingTeacher.name}
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Profile Picture
              </label>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    marginBottom: "10px",
                    display: "block",
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleCloseEdit}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeacher}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
