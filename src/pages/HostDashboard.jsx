import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronDown, ChevronRight, MapPin, Plus, Minus, MessageCircle, Home, Users, Search, Filter, Star, CheckCircle } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import locationService from '../utils/locationService';

const HostImage = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkd1ZXN0PC90ZXh0Pgo8L3N2Zz4K');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src && !hasError) {
      setImgSrc(src);
    }
  }, [src, hasError]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkd1ZXN0PC90ZXh0Pgo8L3N2Zz4K');
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

const HostDashboard = ({ user }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationData, setLocationData] = useState({});

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
              <div key={guest.userId} className="host-card-horizontal">
                <div className="host-image-section">
                  <HostImage 
                    src={guest.profileImageUrl} 
                    alt={guest.name}
                    className="host-card-img"
                  />
                  <button 
                    className="btn btn-primary chat-btn-overlay"
                    onClick={() => setActiveChat({ id: guest.userId, name: guest.name })}
                  >
                    <MessageCircle size={16} className="chat-icon" />
                    <span className="chat-text">Chat</span>
                  </button>
                </div>
                
                <div className="host-content-section">
                  <h3 className="host-name">{guest.name}</h3>
                  <div className="host-location">📍 {guest.location?.split(',')[0] || 'Location not specified'}</div>
                  
                  {guest.bio && (
                    <p className="host-bio">
                      {guest.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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

export default HostDashboard;