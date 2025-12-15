import React, { useState } from 'react';
import './RatingModal.css';

/**
 * RatingModal Component
 * 
 * Allows students to rate and review a teacher after a completed booking.
 * 
 * @param {Object} props
 * @param {Object} props.teacher - Teacher object with _id and name
 * @param {string} props.bookingId - ID of the completed booking
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when rating is submitted successfully
 */
export default function RatingModal({ teacher, bookingId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to submit a rating');
        return;
      }

      const response = await fetch(
        `/api/teachers/${teacher._id}/rate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            rating,
            comment: comment.trim(),
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }

      // Success - call onSubmit callback and close modal
      if (onSubmit) {
        onSubmit(data);
      }
      onClose();
    } catch (err) {
      console.error('Rating submission error:', err);
      setError(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rating-modal-header">
          <h2>Rate Your Experience</h2>
          <button className="rating-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="rating-modal-body">
          <div className="teacher-info">
            <p>How was your lesson with <strong>{teacher.name}</strong>?</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rating-input-section">
              <label className="rating-label">Your Rating *</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isSubmitting}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="rating-text">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="comment-input-section">
              <label htmlFor="comment" className="comment-label">
                Your Review (Optional)
              </label>
              <textarea
                id="comment"
                className="comment-textarea"
                placeholder="Share your experience with this teacher..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
              />
              <span className="char-count">{comment.length}/500</span>
            </div>

            {error && <div className="rating-error">{error}</div>}

            <div className="rating-modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-rating-btn"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
