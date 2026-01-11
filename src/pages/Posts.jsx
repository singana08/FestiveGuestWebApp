import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Calendar, Wifi, Car, Utensils, MessageCircle } from 'lucide-react';
import './Posts.css';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);

  // Mock data
  const mockPosts = [
    {
      id: 1,
      title: "Looking for accommodation during Diwali",
      content: "Need a place to stay for 3 days during Diwali celebration. Prefer vegetarian household.",
      location: "Mumbai, Maharashtra",
      visitors: 2,
      days: 3,
      facilities: ["WiFi", "Parking", "Meals"],
      userName: "Priya Sharma",
      userType: "Guest",
      createdAt: new Date('2024-01-15'),
      status: "Active"
    },
    {
      id: 2,
      title: "Family accommodation needed for Navratri",
      content: "Looking for a comfortable stay for my family of 4 during Navratri festival. We are vegetarian and prefer a quiet neighborhood.",
      location: "Ahmedabad, Gujarat",
      visitors: 4,
      days: 5,
      facilities: ["WiFi", "Meals", "AC"],
      userName: "Rajesh Patel",
      userType: "Guest",
      createdAt: new Date('2024-01-12'),
      status: "Active"
    },
    {
      id: 3,
      title: "Seeking homestay for Ganesh Chaturthi",
      content: "Young couple looking for homestay during Ganesh Chaturthi. We love participating in local celebrations!",
      location: "Pune, Maharashtra",
      visitors: 2,
      days: 4,
      facilities: ["WiFi", "Parking"],
      userName: "Amit & Sneha",
      userType: "Guest",
      createdAt: new Date('2024-01-10'),
      status: "Active"
    }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setPosts(mockPosts);
  }, []);

  const facilityIcons = {
    'WiFi': <Wifi size={16} />,
    'Parking': <Car size={16} />,
    'Meals': <Utensils size={16} />
  };

  const handleCreatePost = (postData) => {
    const newPost = {
      id: Date.now(),
      ...postData,
      userName: user?.name || 'Anonymous',
      userType: user?.userType || 'Guest',
      createdAt: new Date(),
      status: 'Active'
    };
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            {user?.userType === 'Host' ? 'Guest Posts' : 'My Posts & Requests'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>
            {user?.userType === 'Host' 
              ? 'Browse accommodation requests from guests' 
              : 'Create and manage your accommodation requests'
            }
          </p>
        </div>
        {user?.userType === 'Guest' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={20} />
            Create Post
          </button>
        )}
      </div>

      <div className="posts-grid" style={{ display: 'grid', gap: '1.5rem' }}>
        {posts.map(post => (
          <div key={post.id} className="post-card" style={{
            background: 'white',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1.25rem' }}>
                  {post.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                  <span>{post.userName}</span>
                  <span>•</span>
                  <span>{post.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <span style={{
                background: post.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                color: post.status === 'Active' ? '#16a34a' : '#6b7280',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {post.status}
              </span>
            </div>

            <p style={{ margin: '0 0 1rem 0', color: 'var(--text)', lineHeight: '1.6' }}>
              {post.content}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={16} />
                {post.location}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={16} />
                {post.visitors} visitors
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={16} />
                {post.days} days
              </div>
            </div>

            {post.facilities && post.facilities.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {post.facilities.map(facility => (
                    <span key={facility} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: '#f1f5f9',
                      color: 'var(--primary)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {facilityIcons[facility]}
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user?.userType === 'Host' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <MessageCircle size={16} />
                  Contact Guest
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
};

const CreatePostModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    planningDate: '',
    location: '',
    facilities: [],
    visitors: 1,
    days: 1,
    content: ''
  });

  const availableFacilities = [
    { name: 'WiFi', icon: '📶' },
    { name: 'Parking', icon: '🚗' },
    { name: 'Meals', icon: '🍽️' },
    { name: 'AC', icon: '❄️' },
    { name: 'Kitchen', icon: '👨‍🍳' },
    { name: 'Laundry', icon: '👕' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const toggleFacility = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-modern">
          <div className="modal-title-section">
            <div className="modal-icon">✨</div>
            <div>
              <h2>Create New Post</h2>
              <p>Share your accommodation needs with hosts</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-modern">×</button>
        </div>
        
        <div className="modal-body-modern">
          <form onSubmit={handleSubmit} className="modern-form">
            {/* Title */}
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Title</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="modern-input"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Looking for cozy stay during Diwali"
                required
              />
            </div>

            {/* Planning Date */}
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Planning Date</span>
              </label>
              <input
                type="date"
                className="modern-input"
                value={formData.planningDate}
                onChange={(e) => setFormData(prev => ({ ...prev, planningDate: e.target.value }))}
              />
            </div>

            {/* Location */}
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Location</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="modern-input"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Mumbai, Maharashtra"
                required
              />
            </div>

            {/* Preferred Facilities */}
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Preferred Facilities</span>
              </label>
              <div className="facilities-compact">
                {availableFacilities.map(facility => (
                  <button
                    key={facility.name}
                    type="button"
                    onClick={() => toggleFacility(facility.name)}
                    className={`facility-btn-compact ${formData.facilities.includes(facility.name) ? 'selected' : ''}`}
                  >
                    <span className="facility-icon-small">{facility.icon}</span>
                    <span>{facility.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visitors and Days */}
            <div className="form-row">
              <div className="form-group-modern">
                <label className="modern-label">
                  <span className="label-text">Visitors</span>
                </label>
                <div className="number-input-wrapper">
                  <button 
                    type="button" 
                    className="number-btn"
                    onClick={() => setFormData(prev => ({ ...prev, visitors: Math.max(1, prev.visitors - 1) }))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="number-input"
                    min="1"
                    max="10"
                    value={formData.visitors}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitors: parseInt(e.target.value) || 1 }))}
                  />
                  <button 
                    type="button" 
                    className="number-btn"
                    onClick={() => setFormData(prev => ({ ...prev, visitors: Math.min(10, prev.visitors + 1) }))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-group-modern">
                <label className="modern-label">
                  <span className="label-text">Days</span>
                </label>
                <div className="number-input-wrapper">
                  <button 
                    type="button" 
                    className="number-btn"
                    onClick={() => setFormData(prev => ({ ...prev, days: Math.max(1, prev.days - 1) }))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="number-input"
                    min="1"
                    max="30"
                    value={formData.days}
                    onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                  />
                  <button 
                    type="button" 
                    className="number-btn"
                    onClick={() => setFormData(prev => ({ ...prev, days: Math.min(30, prev.days + 1) }))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Additional Details</span>
              </label>
              <textarea
                className="modern-textarea"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe your accommodation needs, preferences, and any special requirements..."
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-secondary-modern">
                Cancel
              </button>
              <button type="submit" className="btn-primary-modern">
                <span>Create Post</span>
                <span className="btn-icon">🚀</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Posts;