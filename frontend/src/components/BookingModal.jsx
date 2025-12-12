import React, { useState } from 'react';
import '../App.css';

export default function BookingModal({ teacher, onClose }) {
  const [lessonType, setLessonType] = useState('trial');
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = lessonType === 'trial' ? teacher.prices.trial : teacher.prices.standard;

  const handlePayment = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert("You need to be logged in to book a lesson.");
      onClose(); 
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          teacherId: teacher._id,
          teacherName: teacher.name,
          lessonType: lessonType,
          price: currentPrice
        })
      });
      
      if (response.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment failed", error);
      alert(error.message || "Something went wrong with payment initiation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book {teacher.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <label 
            className={`option-card ${lessonType === 'trial' ? 'selected' : ''}`}
            onClick={() => setLessonType('trial')}
          >
            <div>
              <strong>Trial Lesson (30 mins)</strong>
              <p>Good for first timers</p>
            </div>
            <div className="price">${teacher.prices.trial}</div>
          </label>

          <label 
            className={`option-card ${lessonType === 'standard' ? 'selected' : ''}`}
            onClick={() => setLessonType('standard')}
          >
            <div>
              <strong>Standard Lesson (60 mins)</strong>
              <p>Regular structured lesson</p>
            </div>
            <div className="price">${teacher.prices.standard}</div>
          </label>
        </div>

        <div className="modal-footer">
          <div className="total">Total: <span>${currentPrice}</span></div>
          <button 
            className="confirm-btn" 
            onClick={handlePayment} 
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}