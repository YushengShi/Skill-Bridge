import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookingModal from "../components/BookingModal";
import "./TeacherDetailPage.css";

export default function TeacherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/teachers/${id}`);
        if (!res.ok) throw new Error("Teacher not found");
        const data = await res.json();
        setTeacher(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  if (loading) return <div className="tdp-loading">Loading...</div>;
  if (!teacher) return <div className="tdp-empty">Teacher not found</div>;

  return (
    <div className="tdp-page">
      <header className="tdp-header">
         <div className="tdp-logo" style={{cursor: 'pointer'}} onClick={() => navigate('/teachers')}>← Back to Teachers</div>
      </header>

      <main className="tdp-container">
        {/* Main Content (Left on Desktop, Top on Mobile) */}
        <section className="tdp-main">
          
          {/* Profile Header Card */}
          <div className="tdp-profile-card">
            <div className="tdp-avatar-wrap">
              <img 
                className="tdp-avatar" 
                src={teacher.avatar || "https://i.pravatar.cc/150"} 
                alt={teacher.name} 
              />
            </div>

            <div className="tdp-profile-info">
              <h1 className="tdp-name">{teacher.name}</h1>
              <p className="tdp-tagline">{teacher.tagline || "Professional Teacher"}</p>

              <div className="tdp-meta">
                <span>⭐ <strong>{teacher.rating?.toFixed(1) || "5.0"}</strong></span>
                <span>•</span>
                <span>{teacher.reviewCount || 0} reviews</span>
                <span>•</span>
                <span>{teacher.lessonCount || 0} lessons</span>
              </div>
              
              <div className="tdp-actions">
                 {/* Badges / Languages */}
                 {teacher.languages && teacher.languages.length > 0 && (
                    <div style={{fontSize: '14px', color: '#4b5563', marginTop: '8px'}}>
                       <strong>Speaks:</strong> {teacher.languages.join(", ")}
                    </div>
                 )}
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="tdp-card">
            <h2>About Me</h2>
            <p className="tdp-bio">{teacher.bio || "This teacher has not written a bio yet."}</p>
            
            {teacher.education && (
               <div style={{marginTop: '15px', fontSize: '14px', color: '#555'}}>
                  <strong>🎓 Education:</strong> {teacher.education}
               </div>
            )}
          </div>

          {/* Skills (New Section) */}
          {teacher.skills && teacher.skills.length > 0 && (
             <div className="tdp-card">
               <h2>Skills & Expertise</h2>
               <div className="skills-cloud">
                  {teacher.skills.map((skill, idx) => (
                     <span key={idx} className="skill-pill">{skill}</span>
                  ))}
               </div>
             </div>
          )}

          {/* Reviews */}
          <div className="tdp-card">
            <h2>Student Reviews ({teacher.reviews?.length || 0})</h2>
            {teacher.reviews && teacher.reviews.length > 0 ? (
               <div className="reviews-list">
                  {teacher.reviews.map((review, idx) => (
                     <div key={idx} className="review-item">
                        <div className="review-head">
                           <strong>{review.studentName || "Student"}</strong> 
                           <span style={{color:'#fbbf24', marginLeft:'6px'}}>{"⭐".repeat(review.rating)}</span>
                           <span style={{color:'#9ca3af', fontSize:'12px', marginLeft:'auto'}}>{new Date(review.date).toLocaleDateString()}</span>
                        </div>
                        <p style={{marginTop:'4px', color:'#4b5563', fontStyle:'italic'}}>"{review.comment}"</p>
                     </div>
                  ))}
               </div>
            ) : (
               <p style={{color: '#9ca3af', fontStyle:'italic'}}>No reviews yet.</p>
            )}
          </div>
        </section>

        {/* Sidebar (Right on Desktop, Bottom on Mobile) */}
        <aside className="tdp-sidebar">
          <div className="tdp-card sticky">
            {teacher.videoUrl && (
                <div style={{background: '#000', color: 'white', padding: '20px', textAlign: 'center', borderRadius: '8px', marginBottom: '15px', cursor: 'pointer'}}>
                   ▶ Video Intro
                </div>
             )}

            <h3 style={{marginTop:0, marginBottom:'15px', fontSize:'18px'}}>Book a Lesson</h3>
            
            <div className="price-row">
              <div>Trial (30 min)</div>
              <div className="price">${teacher.prices?.trial ?? "—"}</div>
            </div>
            <div className="price-row">
              <div>Standard (60 min)</div>
              <div className="price">${teacher.prices?.standard ?? "—"}</div>
            </div>

            <button 
               className="tdp-btn tdp-btn-primary tdp-full"
               onClick={() => setShowBookingModal(true)}
            >
               Check Availability
            </button>
            
            <div style={{textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '12px'}}>
               ⚡ Responds within {teacher.responseTime || "24 hours"}
            </div>

            {/* Available Days Preview */}
            {teacher.availability && Object.values(teacher.availability).some(d => d.length > 0) && (
               <div style={{marginTop: '20px', borderTop: '1px dashed #eef2f7', paddingTop: '15px'}}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280'}}>Available Days</h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                     {Object.keys(teacher.availability).filter(day => teacher.availability[day].length > 0).map(day => (
                        <span key={day} style={{background:'#eff6ff', color:'#1d4ed8', fontSize:'12px', padding:'3px 8px', borderRadius:'4px', textTransform:'capitalize'}}>
                           {day.slice(0,3)}
                        </span>
                     ))}
                  </div>
               </div>
            )}

          </div>
        </aside>
      </main>

      {showBookingModal && (
        <BookingModal 
          teacher={teacher} 
          onClose={() => setShowBookingModal(false)} 
        />
      )}
    </div>
  );
}