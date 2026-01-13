import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Calendar, Wifi, Car, Utensils, MessageCircle, MoreVertical, Edit, Trash2, Filter, Minus } from 'lucide-react';
import postsService from '../utils/postsService';
import locationService from '../utils/locationService';
import ChatWidget from '../components/ChatWidget';
import '../styles/Posts.css';
import '../styles/Dashboard.css';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [user, setUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [hostingAreas, setHostingAreas] = useState([]);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    console.log('Posts: activeChat state changed:', activeChat);
  }, [activeChat]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('DEBUG Posts: User data:', parsedUser);
      console.log('DEBUG Posts: HostingAreas:', parsedUser.hostingAreas);
      setUser(parsedUser);
    }
    fetchPosts();
  }, []);

  // Separate useEffect for hosting areas that depends on user
  useEffect(() => {
    if (user) {
      fetchHostingAreas();
    }
  }, [user]);

  // Handle window resize and set filter defaults
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 768;
      setIsDesktop(desktop);
      if (desktop) {
        setShowMobileFilters(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter posts when posts or selectedAreas change
  useEffect(() => {
    filterPosts();
  }, [posts, selectedAreas]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const guestPosts = await postsService.getGuestPosts();
      const hostPosts = await postsService.getHostPosts();
      
      const allPosts = [
        ...guestPosts.map(post => ({
          id: post.rowKey,
          title: post.title,
          content: post.content,
          location: post.location,
          planningDate: post.planningDate,
          visitors: post.visitors || 1,
          days: post.days || 1,
          facilities: post.facilities ? post.facilities.split(',') : [],
          userName: post.userName || user?.name || 'Unknown',
          userId: post.userId,
          userType: 'Guest',
          createdAt: new Date(post.createdAt),
          status: post.status
        })),
        ...hostPosts.map(post => ({
          id: post.rowKey,
          title: post.title,
          content: post.content,
          location: post.location,
          maxGuests: post.maxGuests || 1,
          pricePerNight: post.pricePerNight,
          amenities: post.amenities ? post.amenities.split(',') : [],
          userName: post.userName || user?.name || 'Unknown',
          userId: post.userId,
          userType: 'Host',
          createdAt: new Date(post.createdAt),
          status: post.status
        }))
      ];
      
      allPosts.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostingAreas = async () => {
    try {
      // If user is a host and has hosting areas, use them directly
      if (user?.userType === 'Host' && user?.hostingAreas && user.hostingAreas.length > 0) {
        console.log('DEBUG Posts: Using hosting areas from user data');
        
        // Filter out empty hosting areas and flatten to area strings
        const validAreas = user.hostingAreas
          .filter(area => area.state && area.state.trim() !== '' && area.cities && area.cities.length > 0)
          .flatMap(area => area.cities.map(city => `${city}, ${area.state}`));
        
        console.log('DEBUG Posts: Valid hosting areas:', validAreas);
        setHostingAreas(validAreas);
      } else {
        console.log('DEBUG Posts: No hosting areas available');
        setHostingAreas([]);
      }
    } catch (error) {
      console.error('Error processing hosting areas:', error);
      setHostingAreas([]);
    }
  };

  const filterPosts = () => {
    if (selectedAreas.length === 0) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => 
        selectedAreas.some(area => 
          post.location?.toLowerCase().includes(area.toLowerCase())
        )
      );
      setFilteredPosts(filtered);
    }
  };

  const toggleArea = (area) => {
    setSelectedAreas(prev => 
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const clearFilters = () => {
    setSelectedAreas([]);
  };

  const facilityIcons = {
    'WiFi': <Wifi size={16} />,
    'Parking': <Car size={16} />,
    'Meals': <Utensils size={16} />
  };

  const handleCreatePost = async (postData) => {
    try {
      const postWithUser = {
        ...postData,
        userName: user?.name || 'Unknown User',
        userId: user?.userId || user?.id,
        planningDate: postData.planningDate ? new Date(postData.planningDate + 'T00:00:00.000Z').toISOString() : null
      };
      
      if (user?.userType === 'Guest') {
        await postsService.createGuestPost(postWithUser);
      } else {
        await postsService.createHostPost(postWithUser);
      }
      setShowCreateModal(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create post. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleUpdatePost = async (postData) => {
    try {
      if (editingPost.userType === 'Guest') {
        await postsService.updateGuestPost(editingPost.id, postData);
      } else {
        await postsService.updateHostPost(editingPost.id, postData);
      }
      setShowEditModal(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (post) => {
    setDeletingPost(post);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const confirmDeletePost = async () => {
    if (!deletingPost) return;
    
    try {
      if (deletingPost.userType === 'Guest') {
        await postsService.deleteGuestPost(deletingPost.id);
      } else {
        await postsService.deleteHostPost(deletingPost.id);
      }
      setShowDeleteModal(false);
      setDeletingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

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
        <span>Filter by Hosting Areas {selectedAreas.length > 0 && `(${selectedAreas.length})`}</span>
        {showFilters ? <Minus size={16} /> : <Plus size={16} />}
      </button>

      {/* Hosting Areas Filters Sidebar */}
      <div 
        className={`location-sidebar ${showFilters ? 'mobile-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-header">
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: isDesktop ? 'default' : 'pointer', width: '100%' }} onClick={() => !isDesktop && setShowMobileFilters(!showMobileFilters)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={20} style={{ color: 'var(--primary)' }} />
              Filter by Hosting Areas
            </div>
            {!isDesktop && (
              <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                {showMobileFilters ? '−' : '+'}
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedAreas.length > 0 && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear ({selectedAreas.length})
              </button>
            )}
          </div>
        </div>
        
        {(isDesktop || showMobileFilters) && (
        <div className="location-filters">
          {hostingAreas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hostingAreas.map(area => (
                <button
                  key={area}
                  className={`city-btn ${selectedAreas.includes(area) ? 'selected' : ''}`}
                  onClick={() => toggleArea(area)}
                >
                  {area}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              {user?.userType === 'Host' ? 'No hosting areas configured' : 'Hosting areas not available'}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Main Content */}
      <div className="browse-main">
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            {user?.userType === 'Host' ? 'Guest Posts' : 'My Posts & Requests'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>
            {user?.userType === 'Host' 
              ? `Browse accommodation requests from guests (${filteredPosts.length} found)` 
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <p>Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
            <p>No posts found{selectedAreas.length > 0 ? ' for selected hosting areas' : ''}.</p>
            {selectedAreas.length > 0 && (
              <button onClick={clearFilters} className="btn btn-outline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user && user.userType === 'Guest' && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === post.id ? null : post.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MoreVertical size={16} color="var(--text-light)" />
                    </button>
                    {activeDropdown === post.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 10,
                        minWidth: '120px'
                      }}>
                        <button
                          onClick={() => handleEditPost(post)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            color: '#dc2626'
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p style={{ margin: '0 0 1rem 0', color: 'var(--text)', lineHeight: '1.6' }}>
              {post.content}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={16} />
                {post.location || 'Location not specified'}
              </div>
              {post.userType === 'Guest' && (
                <>
                  {post.planningDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={16} />
                      {new Date(post.planningDate).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={16} />
                    {post.visitors} visitor{post.visitors !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={16} />
                    {post.days} day{post.days !== 1 ? 's' : ''}
                  </div>
                </>
              )}
              {post.userType === 'Host' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={16} />
                  Up to {post.maxGuests} guest{post.maxGuests !== 1 ? 's' : ''}
                </div>
              )}
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Opening chat with:', { id: post.userId, name: post.userName });
                    setActiveChat(null);
                    setTimeout(() => {
                      setActiveChat({ 
                        id: post.userId, 
                        name: post.userName,
                        imageUrl: null
                      });
                    }, 50);
                  }}
                  className="btn btn-primary" 
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  <MessageCircle size={16} />
                  Contact Guest
                </button>
              </div>
            )}
          </div>
          ))
        )}
      </div>
      </div>
    </div>

      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {showEditModal && editingPost && (
        <CreatePostModal 
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onSubmit={handleUpdatePost}
          initialData={editingPost}
          isEditing={true}
        />
      )}

      {showDeleteModal && deletingPost && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={20} />
                Delete Post
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>
                Are you sure you want to delete <strong>"{deletingPost.title}"</strong>?
              </p>
              <p style={{ margin: '0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', padding: '1rem' }}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
                style={{ minWidth: '80px' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePost}
                className="btn"
                style={{ 
                  minWidth: '80px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: '1px solid #dc2626'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {activeChat && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          width: '350px',
          height: '500px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
          animation: 'slideInUp 0.3s ease-out'
        }}>
          <ChatWidget
            recipientId={activeChat.id}
            recipientName={activeChat.name}
            recipientImageUrl={activeChat.imageUrl}
            onClose={() => {
              console.log('Closing chat widget');
              setActiveChat(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

const CreatePostModal = ({ onClose, onSubmit, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    planningDate: initialData?.planningDate || '',
    state: initialData?.location?.split(', ')[1] || '',
    city: initialData?.location?.split(', ')[0] || '',
    facilities: initialData?.facilities || [],
    visitors: initialData?.visitors || 1,
    days: initialData?.days || 1,
    content: initialData?.content || ''
  });
  const [locationData, setLocationData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locations = await locationService.getLocations();
        setLocationData(locations);
      } catch (error) {
        console.error('Failed to load locations:', error);
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
    fetchLocations();
  }, []);

  const availableFacilities = [
    { name: 'WiFi', icon: '📶' },
    { name: 'Parking', icon: '🚗' },
    { name: 'Meals', icon: '🍽️' },
    { name: 'AC', icon: '❄️' },
    { name: 'Kitchen', icon: '👨🍳' },
    { name: 'Laundry', icon: '👕' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }
    
    if (!formData.state) {
      errors.state = 'Please select a state';
    }
    
    if (!formData.city) {
      errors.city = 'Please select a city';
    }
    
    if (formData.planningDate) {
      const selectedDate = new Date(formData.planningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.planningDate = 'Planning date should be today or in the future';
      }
    }
    
    if (!formData.visitors || formData.visitors < 1 || formData.visitors > 10) {
      errors.visitors = 'Visitors must be between 1 and 10';
    }
    
    if (!formData.days || formData.days < 1 || formData.days > 30) {
      errors.days = 'Days must be between 1 and 30';
    }
    
    if (formData.content && formData.content.trim().length > 0 && formData.content.trim().length < 10) {
      errors.content = 'Description should be at least 10 characters long';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      const location = `${formData.city}, ${formData.state}`;
      const postData = { 
        ...formData, 
        location,
        visitors: parseInt(formData.visitors),
        days: parseInt(formData.days),
        content: formData.content.trim()
      };
      
      await onSubmit(postData);
    } catch (error) {
      console.error('Error submitting post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save post. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              <h2>{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
              <p>{isEditing ? 'Update your accommodation request' : 'Share your accommodation needs with hosts'}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-modern">×</button>
        </div>
        
        <div className="modal-body-modern">
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Title</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="modern-input"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  setValidationErrors(prev => ({ ...prev, title: false }));
                }}
                placeholder="e.g., Looking for cozy stay during Diwali"
                required
                style={{
                  borderColor: validationErrors.title ? '#dc2626' : 'var(--border)'
                }}
              />
              {validationErrors.title && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {validationErrors.title}
                </div>
              )}
            </div>

            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Planning Date</span>
              </label>
              <input
                type="date"
                className="modern-input"
                value={formData.planningDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, planningDate: e.target.value }));
                  setValidationErrors(prev => ({ ...prev, planningDate: false }));
                }}
                style={{
                  borderColor: validationErrors.planningDate ? '#dc2626' : 'var(--border)'
                }}
                min={new Date().toISOString().split('T')[0]}
              />
              {validationErrors.planningDate && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {validationErrors.planningDate}
                </div>
              )}
            </div>

            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Visiting State</span>
                <span className="required-star">*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {Object.keys(locationData).map(state => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, state, city: '' }));
                      setValidationErrors(prev => ({ ...prev, state: false, city: false }));
                    }}
                    style={{
                      padding: '0.75rem 1.25rem',
                      border: `2px solid ${validationErrors.state ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      background: formData.state === state ? '#667eea' : 'white',
                      color: formData.state === state ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      boxShadow: formData.state === state ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {state}
                  </button>
                ))}
              </div>
              {validationErrors.state && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {validationErrors.state}
                </div>
              )}
            </div>

            {formData.state && (
              <div className="form-group-modern">
                <label className="modern-label">
                  <span className="label-text">Visiting City</span>
                  <span className="required-star">*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {locationData[formData.state] && locationData[formData.state].map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, city }));
                        setValidationErrors(prev => ({ ...prev, city: false }));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        border: `2px solid ${validationErrors.city ? '#dc2626' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        background: formData.city === city ? '#667eea' : 'white',
                        color: formData.city === city ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                {validationErrors.city && (
                  <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {validationErrors.city}
                  </div>
                )}
              </div>
            )}

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

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="modern-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  <span className="label-text">Visitors</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, visitors: Math.max(1, prev.visitors - 1) }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.visitors}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitors: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '60px',
                      padding: '0.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, visitors: Math.min(10, prev.visitors + 1) }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="modern-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  <span className="label-text">Days</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, days: Math.max(1, prev.days - 1) }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.days}
                    onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '60px',
                      padding: '0.5rem',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, days: Math.min(30, prev.days + 1) }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid var(--border)',
                      borderRadius: '0.375rem',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Additional Details</span>
              </label>
              <textarea
                className="modern-textarea"
                value={formData.content}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, content: e.target.value }));
                  setValidationErrors(prev => ({ ...prev, content: false }));
                }}
                placeholder="Describe your accommodation needs, preferences, and any special requirements..."
                rows={4}
                style={{
                  borderColor: validationErrors.content ? '#dc2626' : 'var(--border)'
                }}
              />
              {validationErrors.content && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {validationErrors.content}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-secondary-modern" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-modern" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span>Saving...</span>
                    <span className="btn-icon">⏳</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? 'Update Post' : 'Create Post'}</span>
                    <span className="btn-icon">{isEditing ? '✏️' : '🚀'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Posts;