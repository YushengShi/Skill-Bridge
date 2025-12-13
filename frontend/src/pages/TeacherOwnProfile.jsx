import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentProfile.css"; // 复用样式

export default function TeacherOwnProfile({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // UI State
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Teacher Data State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    tagline: "",
    bio: "",
    location: "",
    education: "",
    
    // 🌟 新增字段初始化
    teachingStyle: "",
    specializations: [], // Array
    
    skills: [], 
    languages: [],
    prices: { trial: 0, standard: 0 },
    availability: {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    }
  });

  // Load Data
  useEffect(() => {
    const fetchProfile = async () => {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (!userStr || !token) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user._id || user.id;

      try {
        const response = await fetch(`http://localhost:3000/api/teachers/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(prev => ({
            ...prev,
            ...data,
            // 确保数组不为 null
            skills: data.skills || [],
            languages: data.languages || [],
            specializations: data.specializations || [], // 🌟 加载 specializations
            prices: data.prices || { trial: 10, standard: 25 },
            availability: data.availability || prev.availability
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      prices: { ...prev.prices, [name]: Number(value) }
    }));
  };

  // Handle Array Inputs (Skills, Languages, Specializations)
  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value.split(",").map(item => item.trim())
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user._id || user.id;

      const response = await fetch(`http://localhost:3000/api/teachers/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) throw new Error("Update failed");

      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser)); 

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert("Failed to save profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Schedule Logic
  const handleAddSlot = (day) => {
    const time = prompt("Enter time (e.g., 09:00):");
    if (time && /^\d{2}:\d{2}$/.test(time)) {
      setProfile(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [day]: [...(prev.availability[day] || []), time].sort()
        }
      }));
    } else if (time) {
      alert("Invalid format. Use HH:MM");
    }
  };

  const handleRemoveSlot = (day, index) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: prev.availability[day].filter((_, i) => i !== index)
      }
    }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="student-profile-container">
      <header className="student-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/teacher-dashboard")}>← Dashboard</button>
          <h1>Teacher Profile</h1>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      {saveSuccess && <div className="success-banner">✓ Profile updated successfully!</div>}

      <div className="student-profile-content">
        {/* Sidebar */}
        <aside className="profile-nav">
          <div className="nav-avatar-section">
            <div className={`nav-avatar-wrapper ${isEditing ? "editable" : ""}`} onClick={() => isEditing && fileInputRef.current?.click()}>
              <img src={profile.avatar || "https://i.pravatar.cc/150"} alt="Profile" className="nav-avatar" />
              {isEditing && <div className="avatar-overlay"><span>📷</span></div>}
            </div>
            <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} />
            
            <h3>{profile.name}</h3>
            <p style={{fontSize: '0.9rem', color: '#666'}}>Teacher Account</p>
          </div>

          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
              👤 Public Info
            </button>
            <button className={`nav-item ${activeTab === "availability" ? "active" : ""}`} onClick={() => setActiveTab("availability")}>
              📅 Schedule
            </button>
            <button className={`nav-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
              ⚙️ Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="profile-main-content">
          
          {activeTab === "profile" && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Public Information</h2>
                {!isEditing ? (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
                ) : (
                  <div className="edit-actions">
                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="save-btn" onClick={handleSave} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>

              <form className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input type="text" name="name" value={profile.name} onChange={handleChange} disabled={!isEditing} />
                  </div>
                  <div className="form-group">
                    <label>Email (Read-only)</label>
                    <input type="email" value={profile.email} disabled style={{cursor: 'not-allowed', opacity: 0.7}} />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Tagline (Your Headline)</label>
                  <input type="text" name="tagline" value={profile.tagline} onChange={handleChange} disabled={!isEditing} placeholder="e.g. Certified English Tutor with 5 years experience" />
                </div>

                <div className="form-group full-width">
                  <label>Bio (About Me)</label>
                  <textarea name="bio" value={profile.bio} onChange={handleChange} disabled={!isEditing} rows={5} />
                </div>

                {/* 🌟 新增：Teaching Style */}
                <div className="form-group full-width">
                  <label>Teaching Style</label>
                  <textarea 
                    name="teachingStyle" 
                    value={profile.teachingStyle} 
                    onChange={handleChange} 
                    disabled={!isEditing} 
                    rows={3} 
                    placeholder="Describe your teaching methodology..." 
                  />
                </div>

                {/* 🌟 价格设置 */}
                <div className="form-row highlight-box" style={{background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bde0fe', marginBottom: '20px'}}>
                  <div className="form-group">
                    <label>Trial Price ($) - 30 min</label>
                    <input type="number" name="trial" value={profile.prices.trial} onChange={handlePriceChange} disabled={!isEditing} />
                  </div>
                  <div className="form-group">
                    <label>Standard Price ($) - 60 min</label>
                    <input type="number" name="standard" value={profile.prices.standard} onChange={handlePriceChange} disabled={!isEditing} />
                  </div>
                </div>

                {/* 技能、语言、专长 */}
                <div className="form-row">
                  <div className="form-group">
                     <label>Skills (Comma separated)</label>
                     <input 
                       type="text" 
                       name="skills" 
                       value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills} 
                       onChange={handleArrayChange} 
                       disabled={!isEditing} 
                       placeholder="Grammar, Pronunciation"
                     />
                  </div>
                  <div className="form-group">
                     <label>Languages (Comma separated)</label>
                     <input 
                       type="text" 
                       name="languages" 
                       value={Array.isArray(profile.languages) ? profile.languages.join(", ") : profile.languages} 
                       onChange={handleArrayChange} 
                       disabled={!isEditing} 
                       placeholder="English, Spanish"
                     />
                  </div>
                </div>

                {/* 🌟 新增：Specializations */}
                <div className="form-group full-width">
                   <label>Specializations (Comma separated)</label>
                   <input 
                     type="text" 
                     name="specializations" 
                     value={Array.isArray(profile.specializations) ? profile.specializations.join(", ") : profile.specializations} 
                     onChange={handleArrayChange} 
                     disabled={!isEditing} 
                     placeholder="Business English, IELTS Preparation, Kids"
                   />
                </div>
                
                <div className="form-group full-width">
                   <label>Education / Certifications</label>
                   <input type="text" name="education" value={profile.education || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
              </form>
            </div>
          )}

          {/* Availability Tab 和 Settings Tab 保持原样 */}
          {activeTab === "availability" && (
             <div className="profile-section">
                <div className="section-header">
                  <h2>Weekly Schedule</h2>
                  <p style={{fontSize: '0.9rem', color: '#666'}}>Manage your teaching hours here (e.g. add "09:00" for 9 AM).</p>
                  {isEditing && <button className="save-btn" onClick={handleSave}>Save Schedule</button>}
                  {!isEditing && <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit</button>}
                </div>

                <div className="schedule-grid" style={{display: 'grid', gap: '15px'}}>
                   {Object.keys(profile.availability).map(day => (
                      <div key={day} className="day-row" style={{background: 'white', padding: '15px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', alignItems: 'center'}}>
                         <div style={{width: '100px', fontWeight: 'bold', textTransform: 'capitalize'}}>{day}</div>
                         <div style={{flex: 1, display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                            {(profile.availability[day] || []).map((time, idx) => (
                               <span key={idx} style={{background: '#e3f2fd', color: '#1565c0', padding: '5px 10px', borderRadius: '15px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                  {time}
                                  {isEditing && (
                                     <button 
                                        onClick={() => handleRemoveSlot(day, idx)}
                                        style={{border: 'none', background: 'transparent', cursor: 'pointer', color: '#d32f2f', fontWeight: 'bold'}}
                                     >
                                        ×
                                     </button>
                                  )}
                               </span>
                            ))}
                            {isEditing && (
                               <button 
                                  onClick={() => handleAddSlot(day)}
                                  style={{border: '1px dashed #ccc', background: 'white', borderRadius: '15px', width: '30px', cursor: 'pointer'}}
                               >
                                  +
                               </button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === "settings" && (
            <div className="profile-section">
               <h2>Account Settings</h2>
               <p>Account management options will appear here.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}