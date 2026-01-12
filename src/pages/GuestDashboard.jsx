import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ChevronDown, ChevronRight, MapPin, Plus, Minus, MessageCircle, Home, Users, Search, Filter, Star, CheckCircle, Eye, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import ImageWithSas from '../components/ImageWithSas';
import locationService from '../utils/locationService';
import '../styles/Dashboard.css';

const GuestDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(true);
  const [locationData, setLocationData] = useState({});
  const [signalRStatus, setSignalRStatus] = useState('Not connected');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedHostId, setSelectedHostId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', userType: 'Guest', message: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackSuccessCountdown, setFeedbackSuccessCountdown] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    location: '',
    facilities: [],
    visitors: '',
    days: ''
  });
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState('');
  const [myPosts, setMyPosts] = useState([]);
  const [showMyPosts, setShowMyPosts] = useState(false);

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

  const closeModal = () => {
    setSelectedProfile(null);
    setSelectedHostId(null);
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
    setSelectedHostId(host.userId);
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

  const handleSubmitFeedback = async () => {
    setFeedbackError('');
    
    if (!feedbackForm.name.trim() || !feedbackForm.email.trim() || !feedbackForm.message.trim()) {
      setFeedbackError('Please fill in all required fields');
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      await api.post('feedback', {
        name: feedbackForm.name.trim(),
        email: feedbackForm.email.trim(),
        userType: feedbackForm.userType,
        message: feedbackForm.message.trim()
      });
      
      setFeedbackSuccess(true);
      setFeedbackForm({ name: '', email: '', userType: 'Guest', message: '' });
      setFeedbackSuccessCountdown(5);
      const countdownInterval = setInterval(() => {
        setFeedbackSuccessCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowFeedbackModal(false);
            setFeedbackSuccess(false);
            setFeedbackSuccessCountdown(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      if (error.response?.data?.message) {
        setFeedbackError(error.response.data.message);
      } else {
        setFeedbackError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const fetchMyPosts = async () => {
    try {
      const posts = await postsService.getGuestPosts();
      const userPosts = posts.filter(post => post.userId === user?.userId);
      setMyPosts(userPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleCreatePost = async () => {
    setPostError('');
    
    if (!postForm.title.trim() || !postForm.content.trim() || !postForm.location.trim()) {
      setPostError('Title, content, and location are required');
      return;
    }
    
    setSubmittingPost(true);
    try {
      const postData = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        location: postForm.location.trim(),
        facilities: postForm.facilities,
        visitors: postForm.visitors ? parseInt(postForm.visitors) : null,
        days: postForm.days ? parseInt(postForm.days) : null
      };
      
      await postsService.createGuestPost(postData);
      setShowPostModal(false);
      setPostForm({ title: '', content: '', location: '', facilities: [], visitors: '', days: '' });
      fetchMyPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      setPostError(error.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postsService.deleteGuestPost(postId);
      fetchMyPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const toggleFacility = (facility) => {
    setPostForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
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
        onClick={(e) => {
          e.stopPropagation();
          setShowFilters(!showFilters);
        }}
      >
        <span>Filter by Location {selectedLocations.length > 0 && `(${selectedLocations.length})`}</span>
        {showFilters ? <Minus size={16} /> : <Plus size={16} />}
      </button>

      {/* Location Filters Sidebar */}
      <div 
        className={`location-sidebar ${showFilters ? 'mobile-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-header">
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%' }} onClick={() => setShowMobileFilters(!showMobileFilters)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={20} style={{ color: 'var(--primary)' }} />
              Filter by Location
            </div>
            <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
              {showMobileFilters ? '−' : '+'}
            </span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedLocations.length > 0 && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear ({selectedLocations.length})
              </button>
            )}
          </div>
        </div>
        
        {showMobileFilters && (
        <div className="location-filters">
          {Object.entries(locationData).map(([state, cities]) => (
            <div key={state} className="state-group">
              <button 
                className="state-toggle"
                onClick={() => toggleState(state)}
              >
                <span>{state}</span>
                <span className="expand-icon" style={{ color: 'var(--primary)', background: 'none', border: 'none', borderRadius: '0', fontSize: '1.2rem' }}>
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
        )}
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
                  {selectedLocations.length > 0 ? 'Try selecting different locations or clear filters.' : "We're growing fast! Check back tomorrow for new local hosts."}
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
                  <div key={host.userId} className={`host-card-horizontal ${selectedHostId === host.userId ? 'selected' : ''}`} onClick={() => handleViewProfile(host)}>
                    <div className="host-image-section">
                      <ImageWithSas 
                        src={host.profileImageUrl}
                        alt={host.name}
                        className="host-card-img"
                        userId={host.userId}
                        fallbackText="Host"
                      />
                      <button 
                        className="chat-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactHost(host);
                        }}
                      >
                        <MessageCircle size={16} fill="currentColor" />
                      </button>
                      {host.status === 'Verified' && (
                        <div className="verified-badge">
                          ✓ Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="host-content-section">
                      <h3 className="host-name">{host.name}</h3>
                      <div className="host-location">{host.location.split(',')[0]}</div>
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
                  fallbackText="Profile"
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
      
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Share Your Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {feedbackSuccess ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Thank you!</h4>
                  <p style={{ color: '#64748b' }}>Your feedback has been submitted successfully.</p>
                  {feedbackSuccessCountdown > 0 && (
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '1rem' }}>
                      {feedbackSuccessCountdown}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {feedbackError && (
                    <div style={{ 
                      background: '#fee2e2', 
                      color: '#dc2626', 
                      padding: '0.75rem', 
                      borderRadius: '0.375rem', 
                      marginBottom: '1rem',
                      fontSize: '0.9rem'
                    }}>
                      {feedbackError}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name *</label>
                    <input
                      type="text"
                      value={feedbackForm.name}
                      onChange={(e) => {
                        setFeedbackForm(prev => ({ ...prev, name: e.target.value }));
                        setFeedbackError('');
                      }}
                      placeholder="Your name"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.375rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email *</label>
                    <input
                      type="email"
                      value={feedbackForm.email}
                      onChange={(e) => {
                        setFeedbackForm(prev => ({ ...prev, email: e.target.value }));
                        setFeedbackError('');
                      }}
                      placeholder="your.email@example.com"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.375rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>User Type</label>
                    <select
                      value={feedbackForm.userType}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, userType: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.375rem',
                        fontFamily: 'inherit'
                      }}
                    >
                      <option value="Guest">Guest</option>
                      <option value="Host">Host</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Message *</label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => {
                        setFeedbackForm(prev => ({ ...prev, message: e.target.value }));
                        setFeedbackError('');
                      }}
                      placeholder="Share your thoughts, suggestions, or report any issues..."
                      rows={4}
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
                  
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-outline"
                      onClick={() => setShowFeedbackModal(false)}
                      disabled={submittingFeedback}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback}
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Inline Chat Widget */}
      {activeChat && (
        <ChatWidget 
          recipientId={activeChat.id}
          recipientName={activeChat.name}
          recipientImageUrl={hosts.find(h => h.userId === activeChat.id)?.profileImageUrl}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
};

export default GuestDashboard;