import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Calendar, Wifi, Car, Utensils, MessageCircle, MoreVertical, Edit, Trash2, Filter, Minus } from 'lucide-react';
import postsService from '../utils/postsService';
import locationService from '../utils/locationService';
import ChatWidget from '../components/ChatWidget';
import api from '../utils/api';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/Posts.css';
import '../styles/Dashboard.css';

const Posts = () => {
  const { t } = useLanguage();
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
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedStates, setExpandedStates] = useState({});
  const [locationData, setLocationData] = useState({});
  const [hostingAreasByState, setHostingAreasByState] = useState({});
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

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

  useEffect(() => {
    if (user) {
      if (user.userType === 'Host' && user.hostingAreas) {
        const areasByState = {};
        user.hostingAreas
          .filter(area => area.state && area.cities && area.cities.length > 0)
          .forEach(area => {
            areasByState[area.state] = area.cities;
          });
        setHostingAreasByState(areasByState);
      } else {
        fetchLocations();
      }
    }
  }, [user]);

  // Handle window resize and set filter defaults
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 1024;
      setIsDesktop(desktop);
      setShowMobileFilters(desktop);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, selectedLocations]);

  // Refetch posts when showMyPosts changes
  useEffect(() => {
    fetchPosts();
  }, [showMyPosts]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const fetchLocations = async () => {
    try {
      const locations = await locationService.getLocations();
      setLocationData(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let allPosts = [];
      
      if (showMyPosts) {
        // Show user's own posts
        const myPosts = user?.userType === 'Host' 
          ? await postsService.getMyHostPosts()
          : await postsService.getMyGuestPosts();
        
        allPosts = myPosts.map(post => ({
          id: post.rowKey,
          title: post.title,
          content: post.content,
          location: post.location,
          planningDate: post.planningDate,
          visitors: post.visitors || 1,
          days: post.days || 1,
          maxGuests: post.maxGuests || 1,
          pricePerNight: post.pricePerNight,
          facilities: post.facilities ? post.facilities.split(',') : [],
          amenities: post.amenities ? post.amenities.split(',') : [],
          userName: post.userName || user?.name || 'Unknown',
          userId: post.userId,
          userType: user?.userType,
          createdAt: new Date(post.createdAt),
          status: post.status,
          commenceDate: post.commenceDate
        }));
      } else {
        // Show posts based on user type
        if (user?.userType === 'Host') {
          // Hosts see guest posts
          const guestPosts = await postsService.getGuestPosts();
          allPosts = guestPosts.map(post => ({
            id: post.rowKey,
            title: post.title,
            content: post.content,
            location: post.location,
            planningDate: post.planningDate,
            visitors: post.visitors || 1,
            days: post.days || 1,
            facilities: post.facilities ? post.facilities.split(',') : [],
            userName: post.userName || 'Unknown',
            userId: post.userId,
            userType: 'Guest',
            createdAt: new Date(post.createdAt),
            status: post.status
          }));
        } else {
          // Guests see host posts
          const hostPosts = await postsService.getHostPosts();
          allPosts = hostPosts.map(post => ({
            id: post.rowKey,
            title: post.title,
            content: post.content,
            location: post.location,
            maxGuests: post.maxGuests || 1,
            pricePerNight: post.pricePerNight,
            amenities: post.amenities ? post.amenities.split(',') : [],
            userName: post.userName || 'Unknown',
            userId: post.userId,
            userType: 'Host',
            createdAt: new Date(post.createdAt),
            status: post.status,
            commenceDate: post.commenceDate
          }));
        }
      }
      
      allPosts.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    if (selectedLocations.length === 0) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => 
        selectedLocations.some(location => 
          post.location?.toLowerCase().includes(location.toLowerCase())
        )
      );
      setFilteredPosts(filtered);
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
        <span>{t('filterByLocation')} {selectedLocations.length > 0 && `(${selectedLocations.length})`}</span>
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
              {user?.userType === 'Host' ? t('filterByHostingAreas') : t('filterByLocation')}
            </div>
            {!isDesktop && (
              <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                {showMobileFilters ? '−' : '+'}
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedLocations.length > 0 && (
              <button onClick={clearFilters} className="clear-filters-btn">
                {t('clear')} ({selectedLocations.length})
              </button>
            )}
          </div>
        </div>
        
        {(isDesktop || showMobileFilters) && (
        <div className="location-filters">
          {user?.userType === 'Host' ? (
            Object.keys(hostingAreasByState).length > 0 ? (
              Object.entries(hostingAreasByState).map(([state, cities]) => (
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
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                {t('noHostingAreasConfigured')}
              </div>
            )
          ) : (
          Object.entries(locationData).map(([state, cities]) => (
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
          ))
          )}
        </div>
        )}
      </div>

      {/* Main Content */}
      <div className="browse-main">
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
            {showMyPosts ? t('myPosts') : (user?.userType === 'Host' ? t('guestPosts') : t('allPosts'))}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>
            {showMyPosts 
              ? `${t('manageYourPosts').replace('{userType}', user?.userType === 'Host' ? t('host') : t('guest'))} (${filteredPosts.length} ${t('found')})`
              : (user?.userType === 'Host' 
                ? `${t('browseAccommodationRequests')} (${filteredPosts.length} ${t('found')})` 
                : `${t('browseAllAccommodation')} (${filteredPosts.length} ${t('found')})`)
            }
            {' • '}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setShowHowItWorks(true); }}
              style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {t('howItWorks')}
            </a>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowMyPosts(!showMyPosts)}
            className={showMyPosts ? 'btn btn-outline' : 'btn btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            {showMyPosts ? t('allPosts') : t('myPosts')}
          </button>
          {showMyPosts && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
            >
              <Plus size={20} />
              {t('createPost')}
            </button>
          )}
        </div>
      </div>

      <div className="posts-grid" style={{ display: 'grid', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <p>{t('loadingPosts')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📍</div>
            <p>{selectedLocations.length > 0 
              ? t('noPostsForLocation') 
              : t('noPostsAvailable')}
            </p>
            {selectedLocations.length > 0 && (
              <button onClick={clearFilters} className="btn btn-outline">
                {t('clearFilters')}
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
                  <span 
                    onClick={() => {
                      setSelectedProfile({ userName: post.userName, userId: post.userId });
                      setShowProfileModal(true);
                    }}
                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                  >
                    {post.userName}
                  </span>
                  <span>•</span>
                  <span>{post.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user && (user.userType === 'Guest' || showMyPosts) && post.userId === user.userId && (
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
                          {t('edit')}
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

            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {post.userType === 'Host' ? t('availableLocations') : t('visitingLocation')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={16} />
                {post.location || t('locationNotSpecified')}
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
                <>
                  {post.commenceDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={16} />
                      {t('since')} {new Date(post.commenceDate).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={16} />
                    {t('upTo')} {post.maxGuests} {post.maxGuests !== 1 ? t('guests') : t('guest')}
                  </div>
                  {post.pricePerNight > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ₹{post.pricePerNight}/{t('night')}
                    </div>
                  )}
                </>
              )}
            </div>

            {post.facilities && post.facilities.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('preferredFacilities')}</p>
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

            {post.amenities && post.amenities.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('amenitiesServices')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {post.amenities.map(amenity => (
                    <span key={amenity} style={{
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
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user?.userType === 'Host' && post.userId !== user.userId && (
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
                  {t('contactGuest')}
                </button>
              </div>
            )}

            {user && post.userId !== user.userId && (
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
                  {post.userType === 'Host' ? t('contactHost') : t('contactGuest')}
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
        user?.userType === 'Host' ? (
          <CreateHostPostModal 
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
            user={user}
          />
        ) : (
          <CreatePostModal 
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
          />
        )
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
                {t('deletePost')}
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>
                {t('areYouSureDelete')} <strong>"{deletingPost.title}"</strong>?
              </p>
              <p style={{ margin: '0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                {t('thisActionCannotBeUndone')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', padding: '1rem' }}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
                style={{ minWidth: '80px' }}
              >
                {t('cancel')}
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
                {t('delete')}
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

      {showHowItWorks && (
        <div className="modal-overlay" onClick={() => setShowHowItWorks(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{t('howItWorks')}</h3>
              <button onClick={() => setShowHowItWorks(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {user?.userType === 'Host' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>1️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('browseGuestRequests')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('browseGuestRequests')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>2️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('filterByLocation')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('filterByLocationDesc')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>3️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('contactGuest')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('contactGuestsDesc')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>4️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('createPost')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('createYourHostPost')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>1️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('allPosts')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('browseAllPostsDesc')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>2️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('filterByLocation')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('filterByLocationGuest')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>3️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('createPost')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('createYourGuestPost')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>4️⃣</div>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>{t('myPosts')}</h4>
                      <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5' }}>{t('manageYourPostsDesc')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showProfileModal && selectedProfile && (
        <ProfileModal 
          userName={selectedProfile.userName}
          userId={selectedProfile.userId}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
};

const ProfileModal = ({ userName, userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const profileRes = await api.post('user/public-profile', { userId });
      const currentUserId = user?.userId;
      const reviews = profileRes.data.reviews || [];
      const userReview = reviews.find(r => r.reviewerId === currentUserId);
      const otherReviews = reviews.filter(r => r.reviewerId !== currentUserId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const sortedReviews = userReview ? [userReview, ...otherReviews] : otherReviews;
      const hasUserReview = !!userReview;
      
      setProfile({
        ...profileRes.data,
        reviews: sortedReviews,
        hasUserReview
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
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
        userId: profile.userId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      });
      
      await fetchProfile();
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: '' });
      setReviewError('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      setReviewError(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#fbbf24' : '#d1d5db' }}>★</span>
    ));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>{loading ? 'Loading...' : profile?.name || userName}</h3>
          <button onClick={onClose} className="modal-close" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}>×</button>
        </div>
        <div className="modal-body" style={{ paddingTop: '0.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Profile not found</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                {profile.profileImageUrl ? (
                  <img 
                    src={profile.profileImageUrl} 
                    alt={profile.name}
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '2px solid var(--primary)',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    background: 'var(--primary)', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{profile.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>📍 {profile.location}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0' }}>
                    {profile.userType} • Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              
              {profile.bio && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: 'var(--text)' }}>
                    {profile.userType === 'Host' ? '🏠 About My Hosting' : '✨ About Me'}
                  </h4>
                  <p style={{ 
                    color: '#475569', 
                    lineHeight: '1.5',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    margin: 0
                  }}>
                    {profile.bio}
                  </p>
                </div>
              )}
              
              {profile.userType === 'Host' && profile.hostingAreas && profile.hostingAreas.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: 'var(--text)' }}>🗺️ Hosting Areas</h4>
                  <div style={{ 
                    background: '#f0fdf4',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #86efac'
                  }}>
                    {profile.hostingAreas.map((area, idx) => (
                      <div key={idx} style={{ marginBottom: idx < profile.hostingAreas.length - 1 ? '0.5rem' : '0', color: '#166534' }}>
                        <strong>{area.state}:</strong> {area.cities.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: '0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⭐ Reviews ({profile.totalReviews || profile.reviews?.length || 0})
                    {profile.averageRating > 0 && (
                      <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({profile.averageRating.toFixed(1)} avg)</span>
                    )}
                  </h4>
                  {!profile.hasUserReview && (
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
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    {reviewError && (
                      <div style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        padding: '0.5rem', 
                        borderRadius: '0.375rem', 
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem'
                      }}>
                        {reviewError}
                      </div>
                    )}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Rating:</label>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setReviewForm(prev => ({ ...prev, rating: i + 1 }));
                              setReviewError('');
                            }}
                            style={{ 
                              background: 'none',
                              border: 'none',
                              fontSize: '1.5rem',
                              cursor: 'pointer',
                              color: i < reviewForm.rating ? '#fbbf24' : '#d1d5db',
                              padding: '0'
                            }}
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
                
                {profile.reviews && profile.reviews.length > 0 && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {profile.reviews.map((review, index) => {
                      const isUserReview = review.reviewerId === user?.userId;
                      return (
                        <div 
                          key={index}
                          style={{ 
                            background: isUserReview ? '#fef3c7' : '#f8fafc',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${isUserReview ? '#fbbf24' : 'var(--border)'}`,
                            marginBottom: '0.75rem',
                            position: 'relative'
                          }}
                        >
                          {isUserReview && (
                            <div style={{ 
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              background: '#fbbf24',
                              color: 'white',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              Your Review
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', paddingRight: isUserReview ? '5rem' : '0' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{review.reviewerName}</strong>
                            <div>
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} style={{ color: i < review.rating ? '#fbbf24' : '#d1d5db' }}>★</span>
                              ))}
                            </div>
                          </div>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                            {review.comment}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {(!profile.reviews || profile.reviews.length === 0) && !showReviewForm && (
                  <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateHostPostModal = ({ onClose, onSubmit, user, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    commenceDate: initialData?.commenceDate || '',
    maxGuests: initialData?.maxGuests || 2,
    pricePerNight: initialData?.pricePerNight || 0,
    amenities: initialData?.amenities || [],
    content: initialData?.content || ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hostingAreas = user?.hostingAreas || [];
  const hostingAreasText = hostingAreas
    .filter(area => area.state && area.cities && area.cities.length > 0)
    .map(area => `${area.cities.join(', ')} (${area.state})`)
    .join(' | ');

  const availableAmenities = [
    { name: 'WiFi', icon: '📶' },
    { name: 'Parking', icon: '🚗' },
    { name: 'Meals', icon: '🍽️' },
    { name: 'AC', icon: '❄️' },
    { name: 'Kitchen', icon: '👨🍳' },
    { name: 'Laundry', icon: '👕' },
    { name: 'TV', icon: '📺' },
    { name: 'Hot Water', icon: '🚿' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 10) {
      errors.title = 'Title must be at least 10 characters long';
    }
    
    if (!formData.commenceDate) {
      errors.commenceDate = 'Commence date is required';
    }
    
    if (!formData.maxGuests || formData.maxGuests < 1 || formData.maxGuests > 20) {
      errors.maxGuests = 'Max guests must be between 1 and 20';
    }
    
    if (formData.pricePerNight < 0) {
      errors.pricePerNight = 'Price cannot be negative';
    }
    
    if (formData.content && formData.content.trim().length > 0 && formData.content.trim().length < 20) {
      errors.content = 'Additional details should be at least 20 characters long';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      const postData = { 
        ...formData,
        location: hostingAreasText,
        maxGuests: parseInt(formData.maxGuests),
        pricePerNight: parseFloat(formData.pricePerNight),
        content: formData.content.trim(),
        commenceDate: new Date(formData.commenceDate + 'T00:00:00.000Z').toISOString()
      };
      
      await onSubmit(postData);
    } catch (error) {
      console.error('Error submitting post:', error);
      alert(error.response?.data?.message || error.message || 'Failed to save post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-modern">
          <div className="modal-title-section">
            <div className="modal-icon">🏠</div>
            <div>
              <h2>{isEditing ? 'Edit Host Post' : 'Create Host Post'}</h2>
              <p>Share your hosting services with guests</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-modern">×</button>
        </div>
        
        <div className="modal-body-modern">
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Service Title</span>
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
                placeholder="e.g., Comfortable stay with traditional hospitality"
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
                <span className="label-text">Commence Date</span>
                <span className="required-star">*</span>
              </label>
              <input
                type="date"
                className="modern-input"
                value={formData.commenceDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, commenceDate: e.target.value }));
                  setValidationErrors(prev => ({ ...prev, commenceDate: false }));
                }}
                style={{
                  borderColor: validationErrors.commenceDate ? '#dc2626' : 'var(--border)'
                }}
                required
              />
              {validationErrors.commenceDate && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {validationErrors.commenceDate}
                </div>
              )}
            </div>

            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Hosting Areas</span>
              </label>
              <div style={{
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '0.5rem',
                color: '#166534',
                fontSize: '0.9rem'
              }}>
                {hostingAreasText || 'No hosting areas configured in profile'}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
                Update hosting areas in your profile settings
              </p>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="modern-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  <span className="label-text">Max Guests</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, maxGuests: Math.max(1, prev.maxGuests - 1) }))}
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
                    max="20"
                    value={formData.maxGuests}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: parseInt(e.target.value) || 1 }))}
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
                    onClick={() => setFormData(prev => ({ ...prev, maxGuests: Math.min(20, prev.maxGuests + 1) }))}
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
                  <span className="label-text">Price/Night (₹)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerNight: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem'
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label className="modern-label">
                <span className="label-text">Amenities & Services</span>
              </label>
              <div className="facilities-compact">
                {availableAmenities.map(amenity => (
                  <button
                    key={amenity.name}
                    type="button"
                    onClick={() => toggleAmenity(amenity.name)}
                    className={`facility-btn-compact ${formData.amenities.includes(amenity.name) ? 'selected' : ''}`}
                  >
                    <span className="facility-icon-small">{amenity.icon}</span>
                    <span>{amenity.name}</span>
                  </button>
                ))}
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
                placeholder="Describe your hosting services, house rules, nearby attractions, and any other important information for guests..."
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
    { name: 'Laundry', icon: '👕' },
    { name: 'TV', icon: '📺' },
    { name: 'Hot Water', icon: '🚿' }
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