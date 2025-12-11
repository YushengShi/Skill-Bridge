import React from 'react';
import './styles.css'; // Import the same stylesheet

// Header can be reused from the other file
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


const TeacherDetailPage = () => {
  return (
    <div>
      <Header />
      <main>
        <div className="breadcrumb">
          <a href="/home">Home</a> &gt; <a href="/japanese-teachers">Japanese Teachers</a> &gt; NORIKO
        </div>

        <div className="detail-container">
          {/* Main Content Column */}
          <div className="detail-main">
            <div className="profile-card">
              <div className="profile-header">
                <img src="https://i.pravatar.cc/180?img=45" alt="Teacher NORIKO" width="180" height="180" />
                <div className="profile-header-info">
                  <h1>NORIKO</h1>
                  <p>Professional Japanese Teacher</p>
                  <div>
                    <span>🎓 Professional Teacher</span> | <span>✓ Verified</span>
                  </div>
                  <div className="teacher-stats">
                    <span>⭐ <strong>5.0</strong> (2,458 reviews)</span>
                    <span>📚 <strong>4,892</strong> lessons</span>
                    <span>👥 <strong>892</strong> students</span>
                  </div>
                  <div className="profile-actions">
                    <button className="book-btn">Book Trial Lesson</button>
                    <button className="msg-btn">Message Teacher</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-card">
              <h2>About Me</h2>
              <p>こんにちは！ Hello! I'm NORIKO, a certified Japanese language teacher with over 8 years of teaching experience. I'm passionate about helping students achieve their Japanese learning goals, whether you're a complete beginner or looking to perfect your advanced skills.</p>
              <p><strong>My Teaching Style</strong></p>
              <p>I believe in creating a comfortable and engaging learning environment. My lessons are tailored to your individual needs and learning pace. I use a variety of materials including textbooks, authentic materials, and multimedia resources to make learning Japanese enjoyable and effective.</p>
            </div>

            <div className="content-card">
                <h2>Student Reviews (5.0 ★★★★★)</h2>
                {/* Individual Review */}
                <div>
                    <p><strong>Michael Chen</strong> - <em>2 weeks ago</em> ★★★★★</p>
                    <p>"NORIKO sensei is an excellent teacher! She's patient, encouraging, and her lessons are always well-prepared. I've made significant progress in my Japanese speaking skills. Highly recommend!"</p>
                </div>
                 {/* Individual Review */}
                <div>
                    <p><strong>Sarah Johnson</strong> - <em>1 month ago</em> ★★★★★</p>
                    <p>"I've been taking lessons with NORIKO for 6 months now and passed JLPT N3! Her teaching methods are clear and effective. She explains grammar in a way that's easy to understand and remember."</p>
                </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="detail-sidebar">
            <div className="content-card">
                <h2>Lesson Packages</h2>
                {/* You can map over package data here */}
                <p><strong>Trial Lesson (30 min)</strong> - $12</p>
                <p><strong>Single Lesson (60 min)</strong> - $25</p>
                <p><strong>5 Lesson Package</strong> - $115 ($23/lesson)</p>
                <button className="book-btn" style={{width: '100%', marginTop: '1rem'}}>Book Now</button>
            </div>
            <div className="content-card">
                <h2>Availability</h2>
                <p>Times shown in your timezone (EST)</p>
                {/* A table or calendar component would go here */}
                <button className="details-btn" style={{width: '100%', marginTop: '1rem'}}>View Full Schedule</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDetailPage;
