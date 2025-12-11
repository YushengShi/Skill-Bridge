import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import PaymentForm from './pages/PaymentForm';
import TeacherHome from './components/TeacherHome';
import TeacherListPage from './pages/TeacherListPage'; // Added
import TeacherDetailPage from './pages/TeacherDetailPage'; // Added
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAuth', isAuthenticated);
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/teacherhome" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          } 
        />
        <Route 
          path="/home" 
          element={
            isAuthenticated ? (
              <Home setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/checkout" element={<PaymentForm />} />
        <Route 
          path="/teacherhome" 
          element={
            isAuthenticated ? (
              <TeacherHome setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        {/* Add this dynamic route for individual teacher pages */}
        <Route path="/teachers/:id" element={<TeacherDetailPage />} />
        
        <Route path="/teachers" element={<TeacherHome />} />
        <Route path="/japanese-teachers" element={<TeacherListPage />} />
        
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App;