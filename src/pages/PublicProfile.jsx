import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, MapPin, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';

function PublicProfile() {
  const { userName } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProfile();
  }, [userName]);

  const fetchPublicProfile = async () => {
    try {
      console.log('Fetching profile for userName:', userName);
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`user/public-profile-by-name/${encodeURIComponent(userName)}`),
        api.get(`user/reviews-by-name/${encodeURIComponent(userName)}`)
      ]);
      
      setProfile(profileRes.data);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      console.error('Error details:', error.response?.data);
      console.error('Requested userName:', userName);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={16} 
        fill={i < rating ? '#fbbf24' : 'none'} 
        color={i < rating ? '#fbbf24' : '#d1d5db'} 
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="profile-container text-center" style={{ padding: '3rem' }}>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container text-center" style={{ padding: '3rem' }}>
        <h3>Profile not found</h3>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="profile-container">
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            {profile.userType === 'Host' ? '🏠' : '🎉'} {profile.name}
          </h2>
          <p style={{ color: '#64748b', margin: '0' }}>
            {profile.userType} • Joined {formatDate(profile.createdAt)}
          </p>
        </div>
      </div>
      
      <div className="profile-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <ImageWithSas 
            src={profile.profileImageUrl}
            alt={profile.name}
            style={{ 
              width: '150px', 
              height: '150px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '4px solid var(--border)',
              marginBottom: '1rem'
            }}
            fallbackText="Profile"
          />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={16} color="#64748b" />
            <span style={{ color: '#64748b' }}>{profile.location}</span>
          </div>
          
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {renderStars(Math.round(averageRating))}
              </div>
              <span style={{ fontWeight: '600' }}>{averageRating.toFixed(1)}</span>
              <span style={{ color: '#64748b' }}>({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {profile.userType === 'Host' ? '🏠 About My Hosting' : '✨ About Me'}
          </h4>
          <p style={{ 
            color: '#475569', 
            lineHeight: '1.6',
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '0.75rem',
            borderLeft: '4px solid var(--primary)'
          }}>
            {profile.bio || 'No description provided.'}
          </p>
        </div>
      </div>
      
      {reviews.length > 0 && (
        <div className="profile-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={20} color="#fbbf24" />
            Reviews ({reviews.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((review, index) => (
              <div 
                key={index}
                style={{ 
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{review.reviewerName}</strong>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p style={{ margin: '0', color: '#475569', lineHeight: '1.5' }}>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicProfile;