import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./styles.css";

const TeacherDetailPage = () => {
  const { id } = useParams(); // Get the teacher ID from URL
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/teachers/${id}`);
        const data = await res.json();
        setTeacher(data);
      } catch (error) {
        console.error("Error fetching teacher:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher(); // Call it when the page loads
  }, [id]);

  if (loading) return <h2>Loading...</h2>;
  if (!teacher) return <h2>Teacher not found</h2>;

  return (
    <div className="detail-page">
      <h1>{teacher.name}</h1>
      <img src={teacher.avatar} alt={teacher.name} width="180" />
      <p>{teacher.tagline}</p>
      <p>{teacher.bio}</p>

      <h3>Lesson Prices</h3>
      <p>Trial: ${teacher.prices.trial}</p>
      <p>Standard: ${teacher.prices.standard}</p>
    </div>
  );
};

export default TeacherDetailPage;
