import { useEffect, useState } from 'react';
import { MapPin, Star, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import GlassDialog from './GlassDialog';

const Stars = ({ value, size = 15 }) => (
  <span className="pb-stars" aria-label={`${value} out of 5`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} className={i < Math.round(value) ? 'is-on' : ''} />)}
  </span>
);

/** Public profile + reviews for a post's author (same API calls as before). */
const ProfileModal = ({ open, userId, userName, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [imgFailed, setImgFailed] = useState(false);
  const me = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchProfile = async () => {
    try {
      const profileRes = await api.post('user/public-profile', { userId });
      const reviews = profileRes.data.reviews || [];
      const userReview = reviews.find((r) => r.reviewerId === me?.userId);
      const otherReviews = reviews.filter((r) => r.reviewerId !== me?.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProfile({ ...profileRes.data, reviews: userReview ? [userReview, ...otherReviews] : otherReviews, hasUserReview: !!userReview });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // The page keys this component by userId, so each person starts fresh.
  useEffect(() => {
    if (open && userId) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const handleSubmitReview = async () => {
    setReviewError('');
    if (!reviewForm.comment.trim() || reviewForm.rating === 0) { setReviewError('Please provide both rating and comment'); return; }
    setSubmittingReview(true);
    try {
      await api.post('review', { userId: profile.userId, rating: reviewForm.rating, comment: reviewForm.comment.trim() });
      await fetchProfile();
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: '' });
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const name = profile?.name || userName || 'Profile';
  const joined = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
  const reviewCount = profile?.totalReviews || profile?.reviews?.length || 0;

  return (
    <GlassDialog
      open={open}
      onClose={onClose}
      size="md"
      title={name}
      subtitle={profile ? `${profile.userType === 'Host' ? '🏡 Local host' : '🧳 Traveller'}${joined ? ` · Joined ${joined}` : ''}` : undefined}
    >
      {loading ? (
        <div className="pb-profile-loading"><span className="rg-spinner pb-spinner-light" /> Loading profile…</div>
      ) : !profile ? (
        <p className="pb-muted">Profile not found.</p>
      ) : (
        <div className="pb-profile">
          <div className="pb-profile-top">
            {profile.profileImageUrl && !imgFailed ? (
              <img className="pb-profile-photo" src={profile.profileImageUrl} alt={profile.name} onError={() => setImgFailed(true)} />
            ) : (
              <span className={`pb-avatar pb-avatar--xl pb-avatar--${profile.userType === 'Host' ? 'host' : 'guest'}`} aria-hidden="true">{profile.name.charAt(0).toUpperCase()}</span>
            )}
            <div>
              {profile.location && <p className="pb-profile-loc"><MapPin size={14} /> {profile.location}</p>}
              <p className="pb-profile-rating">
                <Stars value={profile.averageRating || 0} />
                <span>{profile.averageRating > 0 ? `${profile.averageRating.toFixed(1)} · ` : ''}{reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
              </p>
            </div>
          </div>

          {profile.bio && (
            <section className="pb-profile-section">
              <h4>{profile.userType === 'Host' ? 'About my hosting' : 'About me'}</h4>
              <p>{profile.bio}</p>
            </section>
          )}

          {profile.userType === 'Host' && profile.hostingAreas?.length > 0 && (
            <section className="pb-profile-section">
              <h4>Hosting areas</h4>
              <div className="pb-areas pb-areas--wrap">
                {profile.hostingAreas.flatMap((area) => area.cities.map((city) => <span key={`${area.state}-${city}`} className="pb-area">{city}<small> · {area.state}</small></span>))}
              </div>
            </section>
          )}

          <section className="pb-profile-section">
            <div className="pb-profile-reviews-head">
              <h4>Reviews</h4>
              {!profile.hasUserReview && profile.userId !== me?.userId && (
                <button type="button" className="rg-link-btn" onClick={() => setShowReviewForm((v) => !v)}>
                  {showReviewForm ? 'Cancel' : 'Write a review'}
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="pb-review-form">
                {reviewError && <div className="rg-alert" role="alert"><AlertTriangle size={17} /> {reviewError}</div>}
                <div className="pb-star-picker" role="radiogroup" aria-label="Rating">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button key={i} type="button" role="radio" aria-checked={reviewForm.rating === i + 1} aria-label={`${i + 1} star${i ? 's' : ''}`}
                      className={i < reviewForm.rating ? 'is-on' : ''}
                      onClick={() => { setReviewForm((p) => ({ ...p, rating: i + 1 })); setReviewError(''); }}>
                      <Star size={24} />
                    </button>
                  ))}
                </div>
                <textarea className="rg-input rg-textarea" rows={3} placeholder="Share your experience…" value={reviewForm.comment}
                  aria-label="Review" onChange={(e) => { setReviewForm((p) => ({ ...p, comment: e.target.value })); setReviewError(''); }} />
                <button type="button" className="rg-btn rg-btn-primary" onClick={handleSubmitReview} disabled={submittingReview} style={{ marginTop: '0.75rem' }}>
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            )}

            {profile.reviews?.length > 0 ? (
              <ul className="pb-reviews">
                {profile.reviews.map((review, i) => (
                  <li key={i} className={review.reviewerId === me?.userId ? 'is-mine' : ''}>
                    <div className="pb-review-head">
                      <strong>{review.reviewerName}</strong>
                      {review.reviewerId === me?.userId && <span className="pb-badge">Your review</span>}
                      <Stars value={review.rating} size={13} />
                    </div>
                    <p>{review.comment}</p>
                    <small>{new Date(review.createdAt).toLocaleDateString('en-IN')}</small>
                  </li>
                ))}
              </ul>
            ) : !showReviewForm && (
              <p className="pb-muted">No reviews yet. Be the first to share your experience!</p>
            )}
          </section>
        </div>
      )}
    </GlassDialog>
  );
};

export default ProfileModal;
