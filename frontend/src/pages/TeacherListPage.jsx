import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

const Header = () => (
  <header>
    <div className="logo">italki</div>
    <nav>
      <a href="#">Find Teachers</a>
      <a href="#">Community</a>
      <a href="#">For Teachers</a>
      <button>Sign Up</button>
    </nav>
  </header>
);

const TeacherCard = ({ teacher }) => (
  <div className="teacher-card">
    <div>
      <img src={teacher.avatar} alt={teacher.name} width="120" height="120" />
    </div>

    <div className="teacher-info">
      <h2>{teacher.name}</h2>
      <p>{teacher.tagline}</p>
      <div className="teacher-stats">
        {teacher.reviewCount > 0 ? (
          <span>⭐ {teacher.rating?.toFixed(1) || "0.0"}</span>
        ) : (
          <span>⭐ No ratings</span>
        )}
        <span>📚 {teacher.lessonCount || 0} lessons</span>
      </div>

      <p>{teacher.bio.slice(0, 80)}...</p>

      <Link to={`/teachers/${teacher._id}`} className="details-btn">
        See Details
      </Link>
    </div>
  </div>
);

const TeacherListPage = () => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const res = await fetch("http://localhost:3000/api/teachers");
      const data = await res.json();
      setTeachers(data);    // <-- Now we have real MongoDB teachers
    };

    fetchTeachers();
  }, []);

  return (
    <div>
      <Header />

      <main>
        <h1 style={{ textAlign: 'center' }}>Japanese Teachers</h1>

        <div className="teacher-list">
          {teachers.map(teacher => (
            <TeacherCard key={teacher._id} teacher={teacher} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default TeacherListPage;
