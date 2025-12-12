import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TeacherDetailPage.css"; // make sure filename matches

export default function TeacherDetailPage() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/teachers/${id}`);
        if (!res.ok) throw new Error("Teacher not found");
        const data = await res.json();
        setTeacher(data);
      } catch (err) {
        console.error(err);
        setTeacher(null);
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
      
      <main className="tdp-container">
        <section className="tdp-main">
          <div className="tdp-profile-card">
            <div className="tdp-avatar-wrap">
              <img className="tdp-avatar" src={teacher.avatar} alt={teacher.name} />
            </div>

            <div className="tdp-profile-info">
              <h1 className="tdp-name">{teacher.name}</h1>
              <p className="tdp-tagline">{teacher.tagline}</p>

              <div className="tdp-meta">
                <span>⭐ <strong>{teacher.rating ?? "—"}</strong></span>
                <span>•</span>
                <span>{teacher.lessonCount ?? 0} lessons</span>
              </div>

              <div className="tdp-actions">
                
              </div>
            </div>
          </div>

          <div className="tdp-card">
            <h2>About Me</h2>
            <p className="tdp-bio">{teacher.bio}</p>
          </div>

          <div className="tdp-card">
            <h2>Student Reviews</h2>
            {/* If you have reviews array, map them. Example below is placeholder */}
            <div className="review">
              <div className="review-head"><strong>Michael Chen</strong> • 5.0 • 2 weeks ago</div>
              <p>"Great teacher..."</p>
            </div>
          </div>
        </section>

        <aside className="tdp-sidebar">
          <div className="tdp-card sticky">
            <h3>Lesson Packages</h3>
            <div className="price-row">
              <div>Trial (30 min)</div><div className="price">${teacher.prices?.trial ?? "—"}</div>
            </div>
            <div className="price-row">
              <div>Single (60 min)</div><div className="price">${teacher.prices?.standard ?? "—"}</div>
            </div>

            
          </div>

       
        </aside>
      </main>
    </div>
  );
}
