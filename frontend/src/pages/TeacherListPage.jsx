import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css'; // Import the same stylesheet


// A reusable Header component
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

// A reusable TeacherCard component
const TeacherCard = ({ teacher }) => (
  <div className="teacher-card">
    <div>
      <img src={teacher.imageUrl} alt={`Teacher ${teacher.name}`} width="120" height="120" />
    </div>
    <div className="teacher-info">
      <h2>{teacher.name}</h2>
      <p>{teacher.title}</p>
      <div className="teacher-stats">
        <span>⭐ <strong>{teacher.rating}</strong> ({teacher.reviews})</span>
        <span>📚 {teacher.lessons} lessons</span>
      </div>
      <p>{teacher.intro}</p>
      {/* In a real app, this would be a <Link> from react-router-dom */}
      <Link to="/teacher-detail" className="details-btn">See Details</Link>
    </div>
  </div>
);

// The main page component
const TeacherListPage = () => {
  const teachers = [
    {
      id: 1,
      name: 'NORIKO',
      title: 'Professional Japanese Teacher',
      rating: 5.0,
      reviews: '2,458',
      lessons: '4,892',
      intro: "こんにちは！ Hello! I'm NORIKO, a certified Japanese language teacher with over 8 years of teaching experience...",
      imageUrl: 'https://i.pravatar.cc/120?img=45',
    },
    {
      id: 2,
      name: 'Kenji',
      title: 'Community Tutor',
      rating: 4.9,
      reviews: '1,230',
      lessons: '2,500',
      intro: "Hi, I'm Kenji! Let's have fun conversations in Japanese to help you improve your speaking and listening skills...",
      imageUrl: 'https://i.pravatar.cc/120?img=68',
    },
    {
      id: 3,
      name: 'Yuka',
      title: 'Professional Japanese Teacher',
      rating: 5.0,
      reviews: '987',
      lessons: '1,800',
      intro: 'I specialize in teaching beginners and preparing students for the JLPT. My lessons are structured and easy to follow...',
      imageUrl: 'https://i.pravatar.cc/120?img=32',
    },
  ];

  return (
    <div>
      <Header />
      <main>
        <h1 style={{ textAlign: 'center' }}>Japanese Teachers</h1>
        <div className="teacher-list">
          {teachers.map(teacher => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default TeacherListPage;
