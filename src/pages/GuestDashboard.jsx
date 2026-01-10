import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ChevronDown, ChevronRight, MapPin, Plus, Minus, MessageCircle, Home, Users, Search, Filter, Star, CheckCircle, Eye } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import locationService from '../utils/locationService';

const HostImage = ({ src, alt, className, userId }) => {
  const [imgSrc, setImgSrc] = useState(src || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src && !hasError) {
      setImgSrc(src);
    }
  }, [src, hasError]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K');
    }
  };

  return (
    <img 
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

const GuestDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationData, setLocationData] = useState({});
  const [signalRStatus, setSignalRStatus] = useState('Not connected');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    // Only fetch data if user is properly authenticated
    if (user && user.token) {
      fetchHosts();
      fetchLocations();
    }
  }, [user]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('location/states-with-cities');
      setLocationData(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback: provide basic Indian states if API fails
      setLocationData({
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Other'],
        'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Other'],
        'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Other'],
        'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Other'],
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Other'],
        'Delhi': ['New Delhi', 'Other']
      });
    }
  };

  useEffect(() => {
    filterHosts();
  }, [hosts, selectedLocations]);

  const filterHosts = () => {
    if (selectedLocations.length === 0) {
      setFilteredHosts(hosts);
    } else {
      const filtered = hosts.filter(host => 
        selectedLocations.some(location => 
          host.location?.toLowerCase().includes(location.toLowerCase())
        )
      );
      setFilteredHosts(filtered);
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

  const fetchHosts = async () => {
    try {
      const res = await api.get('user/browse');
      const hostsData = Array.isArray(res.data) ? res.data : [res.data];
      const activeHosts = hostsData.filter(h => (h.status === 'Active' || h.status === 'Verified'));
      
      setHosts(activeHosts);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      if (error.response?.status === 500) {
        console.error('Server error - API may be down or misconfigured');
        // Show user-friendly message for server errors
        setHosts([]);
      } else if (error.response?.status !== 401 && error.response?.status !== 403) {
        setHosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (host) => {
    setProfileLoading(true);
    try {
      const profileRes = await api.post('user/public-profile', {
        userId: host.userId
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

  const handleContactHost = (host) => {
    setActiveChat({ id: host.userId, name: host.name });
  };

  const handleSubmitReview = async () => {
    console.log('Submit clicked, reviewError before:', reviewError);
    console.log('Rating:', reviewForm.rating, 'Comment:', reviewForm.comment);
    
    setReviewError('');
    
    if (!reviewForm.comment.trim() || reviewForm.rating === 0) {
      console.log('Setting error message');
      setReviewError('Please provide both rating and comment');
      console.log('reviewError after setting:', 'Please provide both rating and comment');
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

  if (loading) return (
    <div className="container">
      <div className="loading" style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h3>Finding amazing hosts for you...</h3>
      </div>
    </div>
  );

  return (
    <div className="browse-layout">
      {/* Mobile Filter Toggle Button */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? <Minus size={16} /> : <Plus size={16} />}
        Filters {selectedLocations.length > 0 && `(${selectedLocations.length})`}
      </button>

      {/* Location Filters Sidebar */}
      <div className={`location-sidebar ${showFilters ? 'mobile-visible' : ''}`}>
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
                {expandedStates[state] ? 
                  <ChevronDown size={16} /> : 
                  <ChevronRight size={16} />
                }
                <span>{state}</span>
              </button>
              
              {expandedStates[state] && (
                <div className="cities-list">
                  {cities.map(city => (
                    <label key={city} className="city-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(city)}
                        onChange={() => toggleLocation(city)}
                      />
                      <span>{city}</span>
                    </label>
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
            <Home size={24} style={{ color: 'var(--primary)' }} />
            Available Hosts
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="results-count" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!loading && (
                <>
                  <Users size={16} style={{ color: 'var(--text-light)' }} />
                  <span>{filteredHosts.length} host{filteredHosts.length !== 1 ? 's' : ''} found</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="loading" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3>Finding amazing hosts for you...</h3>
          </div>
        ) : (
          <div>
            {filteredHosts.length === 0 ? (
              <div className="no-results">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
                <h3 style={{ color: '#1e293b' }}>No hosts found{selectedLocations.length > 0 ? ' for selected locations' : ' in this area yet'}</h3>
                <p style={{ color: '#64748b' }}>
                  {selectedLocations.length > 0 ? 'Try selecting different locations or clear filters.' : "We're growing fast! Check back tomorrow for new Pongal celebrations."}
                </p>
                {selectedLocations.length > 0 && (
                  <button onClick={clearFilters} className="btn btn-outline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="compact-grid">
                {filteredHosts.map(host => (
                  <div key={host.userId} className="host-card-horizontal">
                    <div className="host-image-section">
                      <HostImage 
                        src={host.profileImageUrl}
                        alt={host.name}
                        className="host-card-img"
                        userId={host.userId}
                      />
                      {host.status === 'Verified' && (
                        <div className="verified-badge">
                          ✓ Verified
                        </div>
                      )}
                      <button 
                        className="btn btn-primary overlay-btn"
                        onClick={() => handleViewProfile(host)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                    
                    <div className="host-content-section">
                      <h3 className="host-name">{host.name}</h3>
                      <div className="host-location">📍 {host.location.split(',')[0]}</div>
                      
                      {host.bio && (
                        <p className="host-bio">
                          {host.bio}
                        </p>
                      )}
                      
                      <button 
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactHost(host);
                        }}
                        style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', minHeight: '32px', width: 'auto', display: 'inline-flex' }}
                      >
                        <MessageCircle size={14} /> Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Profile Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProfile.name}</h3>
              <button onClick={() => setSelectedProfile(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <HostImage 
                  src={selectedProfile.profileImageUrl}
                  alt={selectedProfile.name}
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '3px solid var(--border)',
                    marginBottom: '1rem'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>{selectedProfile.location}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {selectedProfile.userType} • Joined {new Date(selectedProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
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
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default GuestDashboard;