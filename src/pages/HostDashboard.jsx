import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronDown, ChevronRight, MapPin, Plus, Minus, MessageCircle, Home, Users, Search, Filter, Star, CheckCircle, Eye } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import ImageWithSas from '../components/ImageWithSas';
import locationService from '../utils/locationService';

const HostDashboard = ({ user }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationData, setLocationData] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedGuestId, setSelectedGuestId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (user.status === 'Active' || user.status === 'Verified') {
      fetchGuests();
      fetchLocations();
    } else {
      setLoading(false);
    }
  }, [user.status]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('location/states-with-cities');
      setLocationData(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    filterGuests();
  }, [guests, selectedLocations]);

  const fetchGuests = async () => {
    try {
      const res = await api.get('user/browse');
      const guestsData = Array.isArray(res.data) ? res.data : [res.data];
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching guests:', error);
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterGuests = () => {
    if (selectedLocations.length === 0) {
      setFilteredGuests(guests);
    } else {
      const filtered = guests.filter(guest => 
        selectedLocations.some(location => 
          guest.location?.toLowerCase().includes(location.toLowerCase())
        )
      );
      setFilteredGuests(filtered);
    }
  };

  const toggleState = (state) => {
    setExpandedStates(prev => ({
      ...prev,
      [state]: !prev[state]
    }));
  };

  const toggleLocation = (location) => {
    setSelectedLocations(prev => 
      prev.includes(location)
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedLocations([]);
  };

  const closeModal = () => {
    setSelectedProfile(null);
    setSelectedGuestId(null);
    document.body.style.overflow = 'unset';
  };

  useEffect(() => {
    if (selectedProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProfile]);

  const handleViewProfile = async (guest) => {
    setSelectedGuestId(guest.userId);
    setProfileLoading(true);
    try {
      const profileRes = await api.post('user/public-profile', {
        userId: guest.userId
      });
      
      // Sort reviews: user's own review first, then others by recent to old
      const currentUserId = user?.userId;
      const reviews = profileRes.data.reviews || [];
      const userReview = reviews.find(r => r.reviewerId === currentUserId);
      const otherReviews = reviews.filter(r => r.reviewerId !== currentUserId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const sortedReviews = userReview ? [userReview, ...otherReviews] : otherReviews;
      const hasUserReview = !!userReview;
      
      setSelectedProfile({
        ...profileRes.data,
        reviews: sortedReviews,
        hasUserReview
      });
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: '' });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setReviewError('');
    
    if (!reviewForm.comment.trim() || reviewForm.rating === 0) {
      setReviewError('Please provide both rating and comment');
      return;
    }
    
    setSubmittingReview(true);
    try {
      await api.post('review', {
        userId: selectedProfile.userId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      });
      
      // Refresh profile data to show new review
      const profileRes = await api.post('user/public-profile', {
        userId: selectedProfile.userId
      });
      
      // Sort reviews: user's own review first, then others by recent to old
      const currentUserId = user?.userId;
      const reviews = profileRes.data.reviews || [];
      const userReview = reviews.find(r => r.reviewerId === currentUserId);
      const otherReviews = reviews.filter(r => r.reviewerId !== currentUserId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const sortedReviews = userReview ? [userReview, ...otherReviews] : otherReviews;
      const hasUserReview = !!userReview;
      
      setSelectedProfile({
        ...profileRes.data,
        reviews: sortedReviews,
        hasUserReview
      });
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: '' });
      setReviewError('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      if (error.response?.data?.message) {
        setReviewError(error.response.data.message);
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (user.status === 'Pending') {
    return (
      <div className="container" style={{ paddingTop: '5rem' }}>
        <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ color: '#1e293b', fontSize: '2rem', marginBottom: '1rem' }}>Registration Pending</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Thank you for joining as a Host! Your registration is currently being verified by our team. 
            Once approved, you'll be able to see guests and start hosting.
          </p>
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}><strong>Next Steps:</strong></p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>Admin verifies your payment</li>
              <li>Your profile becomes "Active"</li>
              <li>You receive guests' contact requests</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="container">
      <div className="loading" style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
        <h3>Loading guests near you...</h3>
      </div>
    </div>
  );

  return (
    <div className="browse-layout" onClick={() => showFilters && setShowFilters(false)}>
      {/* Mobile Filter Toggle Button */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowFilters(!showFilters)}
      >
        <span>Filters {selectedLocations.length > 0 && `(${selectedLocations.length})`}</span>
        {showFilters ? <Minus size={16} /> : <Plus size={16} />}
      </button>

      {/* Location Filters Sidebar */}
      <div 
        className={`location-sidebar ${showFilters ? 'mobile-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} style={{ color: 'var(--primary)' }} />
            Filter by Location
          </h3>
          {selectedLocations.length > 0 && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear ({selectedLocations.length})
            </button>
          )}
        </div>
        
        <div className="location-filters">
          {Object.entries(locationData).map(([state, cities]) => (
            <div key={state} className="state-group">
              <button 
                className="state-toggle"
                onClick={() => toggleState(state)}
              >
                <span>{state}</span>
                <span className="expand-icon">
                  {expandedStates[state] ? '-' : '+'}
                </span>
              </button>
              
              {expandedStates[state] && (
                <div className="cities-list">
                  {cities.map(city => (
                    <button
                      key={city}
                      className={`city-btn ${selectedLocations.includes(city) ? 'selected' : ''}`}
                      onClick={() => toggleLocation(city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="browse-main">
        <div className="browse-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={24} style={{ color: 'var(--primary)' }} />
            Guests Looking for Festivals
          </h2>
          <div className="results-count" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!loading && (
              <>
                <Users size={16} style={{ color: 'var(--text-light)' }} />
                <span>{filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} found</span>
              </>
            )}
          </div>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="no-results">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
            <h3 style={{ color: '#1e293b' }}>
              {selectedLocations.length > 0 ? 'No guests found for selected locations' : 'No guests found right now'}
            </h3>
            <p style={{ color: '#64748b' }}>
              {selectedLocations.length > 0 ? 'Try adjusting your location filters or check back later.' : 'Check back soon as more travelers join the festival celebrations!'}
            </p>
            {selectedLocations.length > 0 && (
              <button onClick={clearFilters} className="btn btn-outline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="compact-grid">
            {filteredGuests.map(guest => (
              <div key={guest.userId} className={`host-card-horizontal ${selectedGuestId === guest.userId ? 'selected' : ''}`} onClick={() => handleViewProfile(guest)}>
                <div className="host-image-section">
                  <ImageWithSas 
                    src={guest.profileImageUrl} 
                    alt={guest.name}
                    className="host-card-img"
                    fallbackText="Guest"
                  />
                  <button 
                    className="chat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChat({ id: guest.userId, name: guest.name });
                    }}
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
                
                <div className="host-content-section">
                  <h3 className="host-name">{guest.name}</h3>
                  <div className="host-location">{guest.location?.split(',')[0] || 'Location not specified'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Profile Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedProfile.name}</h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <ImageWithSas 
                  src={selectedProfile.profileImageUrl}
                  alt={selectedProfile.name}
                  className="modal-profile-image"
                  fallbackText="Guest"
                  style={{ flexShrink: 0, width: '100px', height: '100px' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{selectedProfile.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>📍 {selectedProfile.location}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0' }}>
                    {selectedProfile.userType} • Joined {new Date(selectedProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--text)' }}>
                  {selectedProfile.userType === 'Host' ? '🏠 About My Hosting' : '✨ About Me'}
                </h4>
                <p style={{ 
                  color: '#475569', 
                  lineHeight: '1.5',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  margin: '0'
                }}>
                  {selectedProfile.bio || 'No description provided.'}
                </p>
              </div>
              
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: '0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⭐ Reviews ({selectedProfile.totalReviews || selectedProfile.reviews?.length || 0})
                    {selectedProfile.averageRating > 0 && (
                      <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({selectedProfile.averageRating.toFixed(1)} avg)</span>
                    )}
                  </h4>
                  {!selectedProfile.hasUserReview && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      {showReviewForm ? 'Cancel' : 'Write Review'}
                    </button>
                  )}
                </div>
                
                {showReviewForm && (
                  <div className="review-form">
                    {reviewError && (
                      <div className="review-error">
                        {reviewError}
                      </div>
                    )}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Rating:</label>
                      <div className="rating-input">
                        {Array.from({ length: 5 }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            className="rating-star"
                            onClick={() => {
                              setReviewForm(prev => ({ ...prev, rating: i + 1 }));
                              setReviewError('');
                            }}
                            style={{ color: i < reviewForm.rating ? '#fbbf24' : '#d1d5db' }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Comment:</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => {
                          setReviewForm(prev => ({ ...prev, comment: e.target.value }));
                          setReviewError('');
                        }}
                        placeholder="Share your experience..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}
                
                {selectedProfile.reviews && selectedProfile.reviews.length > 0 && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedProfile.reviews.map((review, index) => {
                      const isUserReview = review.reviewerId === user?.userId;
                      return (
                        <div key={index} className={`review-item ${isUserReview ? 'user-review' : ''}`}>
                          {isUserReview && (
                            <div className="user-review-badge">
                              Your Review
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', paddingRight: isUserReview ? '5rem' : '0' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{review.reviewerName}</strong>
                            <div className="review-stars">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} style={{ color: i < review.rating ? '#fbbf24' : '#d1d5db' }}>★</span>
                              ))}
                            </div>
                          </div>
                          <p style={{ margin: '0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                            {review.comment}
                          </p>
                          <div className="review-meta">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {(!selectedProfile.reviews || selectedProfile.reviews.length === 0) && !showReviewForm && (
                  <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {profileLoading && (
        <div className="modal-overlay">
          <div className="loading" style={{ color: 'white' }}>Loading profile...</div>
        </div>
      )}
      
      {/* Inline Chat Widget */}
      {activeChat && (
        <ChatWidget 
          recipientId={activeChat.id}
          recipientName={activeChat.name}
          recipientImageUrl={guests.find(g => g.userId === activeChat.id)?.profileImageUrl}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default HostDashboard;