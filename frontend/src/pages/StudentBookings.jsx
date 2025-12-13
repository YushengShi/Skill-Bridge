import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RatingModal from '../components/RatingModal';
import './StudentBookings.css'; 

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingModal, setRatingModal] = useState({ show: false, teacher: null, bookingId: null });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:3000/api/students/my-bookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to fetch bookings");
        }

        const data = await response.json();

        // Show paid, confirmed, and completed bookings
        const activeBookings = data.filter(booking => 
          ['paid', 'confirmed', 'completed'].includes(booking.status)
        );

        setBookings(activeBookings);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <span className="status-badge success">Paid</span>;
      case 'completed': return <span className="status-badge info">Completed</span>;
      case 'confirmed': return <span className="status-badge warning">Confirmed</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  const handleJoinRoom = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const url = `http://localhost:3000/api/students/bookings/${bookingId}/complete`;
      console.log('🔄 Completing booking:', bookingId);
      console.log('🔄 Request URL:', url);

      // Mark booking as completed
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers.get('content-type'));

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to complete booking');
        } else {
          // If not JSON, read as text to see what the error is
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
      }

      // Parse successful response
      const data = await response.json();

      // Refresh bookings to show updated status
      const updatedBookings = bookings.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: 'completed' }
          : booking
      );
      setBookings(updatedBookings);

      // Show success message
      alert('Lesson marked as completed! You can now rate your teacher.');
    } catch (err) {
      console.error('Error completing booking:', err);
      alert(err.message || 'Failed to complete booking. Please try again.');
    }
  };

  if (loading) return (
    <div className="bookings-page">
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your schedule...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bookings-page">
      <div className="error-container">
        <h2>Oops!</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="bookings-page">
      <header className="page-header">
        <h1>My Lessons</h1>
        <button onClick={() => navigate('/teacherhome')} className="back-btn">
          Book New Lesson
        </button>
      </header>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h2>No lessons found</h2>
          <p>You don't have any paid, confirmed, or completed lessons currently.</p>
          <button onClick={() => navigate('/teacherhome')} className="primary-btn">
            Find a Teacher
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <div className="teacher-info">
                  <img 
                    src={booking.teacherId?.avatar || "https://i.pravatar.cc/150"} 
                    alt="Teacher" 
                    className="teacher-avatar-small"
                  />
                  <div>
                    <h3>{booking.teacherId?.name || "Unknown Teacher"}</h3>
                    <span className="lesson-type">{booking.lessonType.toUpperCase()}</span>
                  </div>
                </div>
                <div className="booking-price">
                  ${booking.amount}
                </div>
              </div>
              
              <div className="booking-details">
                <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="detail-row hide-on-mobile">
                    <span className="label">Booking ID:</span>
                    <span className="id-text">{booking._id.slice(-6)}</span>
                </div>
                <div className="detail-row hide-on-mobile">
                    <span className="label">Contact:</span>
                    <span className="value">{booking.teacherId?.email || "N/A"}</span>
                </div>
              </div>

              <div className="booking-footer">
                <div className="status-container">
                    {getStatusBadge(booking.status)}
                </div>
                
                <div className="action-buttons">
                  {booking.status === 'completed' && booking.teacherId ? (
                    <button 
                      className="rate-btn"
                      onClick={() => setRatingModal({
                        show: true,
                        teacher: booking.teacherId,
                        bookingId: booking._id
                      })}
                    >
                      ⭐ Rate Teacher
                    </button>
                  ) : (booking.status === 'paid' || booking.status === 'confirmed') ? (
                    <button 
                      className="join-btn"
                      onClick={() => handleJoinRoom(booking._id)}
                    >
                      Complete Lesson
                    </button>
                  ) : (
                    <button className="join-btn" disabled>
                      {booking.status}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.show && ratingModal.teacher && (
        <RatingModal
          teacher={ratingModal.teacher}
          bookingId={ratingModal.bookingId}
          onClose={() => setRatingModal({ show: false, teacher: null, bookingId: null })}
          onSubmit={async (data) => {
            // Refresh bookings after rating is submitted
            try {
              const token = localStorage.getItem('token');
              const response = await fetch('http://localhost:3000/api/students/my-bookings', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const updatedData = await response.json();
                const activeBookings = updatedData.filter(booking => 
                  ['paid', 'confirmed', 'completed'].includes(booking.status)
                );
                setBookings(activeBookings);
              }
            } catch (err) {
              console.error('Error refreshing bookings:', err);
            }
          }}
        />
      )}
    </div>
  );
}