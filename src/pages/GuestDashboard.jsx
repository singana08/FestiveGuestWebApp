import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronDown, ChevronRight, MapPin, Plus, Minus } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import locationService from '../utils/locationService';

const GuestDashboard = ({ user }) => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationData, setLocationData] = useState({});

  useEffect(() => {
    // Only fetch data if user is properly authenticated
    if (user && user.token) {
      fetchHosts();
      fetchLocations();
    }
  }, [user]);

  const fetchLocations = async () => {
    try {
      const data = await locationService.getLocations();
      setLocationData(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
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
      const res = await api.get('getuser', { params: { role: 'Host' } });
      const hostsData = Array.isArray(res.data) ? res.data : [res.data];
      const activeHosts = hostsData.filter(h => (h.status === 'Active' || h.status === 'Verified'));
      
      // Get image URLs for hosts
      const hostsWithImages = await Promise.all(
        activeHosts.map(async (host) => {
          if (host.profileImageUrl && host.profileImageUrl.includes('blob.core.windows.net')) {
            try {
              const imgRes = await api.get('getimageurl', { params: { userId: host.rowKey } });
              return { ...host, profileImageUrl: imgRes.data.imageUrl };
            } catch (e) {
              console.log('No image for host:', host.rowKey);
              return host;
            }
          }
          return host;
        })
      );
      
      setHosts(hostsWithImages);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setHosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContactHost = (host) => {
    setActiveChat({ id: host.rowKey, name: host.name });
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
          <h3><MapPin size={20} /> Filter Hosts by Location</h3>
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
          <h2>🏠 Available Hosts</h2>
          <div className="results-count">
            {!loading && (
              <span>{filteredHosts.length} host{filteredHosts.length !== 1 ? 's' : ''} found</span>
            )}
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
                  <div key={host.rowKey} className="host-card-horizontal">
                    <div className="host-image-section">
                      <img 
                        src={host.profileImageUrl || 'https://via.placeholder.com/400x300?text=Host'} 
                        alt={host.name}
                        className="host-card-img"
                      />
                      {host.status === 'Verified' && (
                        <div className="verified-badge">
                          ✓ Verified
                        </div>
                      )}
                      <button 
                        className="btn btn-primary chat-btn-overlay"
                        onClick={() => handleContactHost(host)}
                      >
                        <span className="chat-icon">💬</span>
                        <span className="chat-text">Chat</span>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default GuestDashboard;
