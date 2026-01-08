import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ChevronDown, ChevronRight, MapPin, Plus, Minus, MessageCircle, Home, Users, Search, Filter, Star, CheckCircle } from 'lucide-react';
import ChatWidget from '../components/ChatWidget';
import locationService from '../utils/locationService';
import chatService from '../utils/chatService';

const GuestDashboard = ({ user }) => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState({});
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationData, setLocationData] = useState({});
  const [signalRStatus, setSignalRStatus] = useState('Not connected');

  const testSignalR = async () => {
    try {
      setSignalRStatus('Connecting...');
      await chatService.connect();
      setSignalRStatus('✅ Connected');
      console.log('SignalR test successful');
      
      // Setup message listener
      chatService.onReceiveMessage((data) => {
        console.log('✅ Test message received:', data);
        alert(`Message received from ${data.senderId}: ${data.message}`);
      });
    } catch (error) {
      setSignalRStatus('❌ Failed: ' + error.message);
      console.error('SignalR test failed:', error);
    }
  };

  const sendTestMessage = async () => {
    try {
      const testUserId = prompt('Enter recipient userId to test:');
      if (!testUserId) return;
      
      await chatService.joinChat(testUserId);
      await chatService.sendMessage(testUserId, 'Test message from ' + userId);
      console.log('✅ Test message sent to:', testUserId);
      alert('Test message sent! Check console.');
    } catch (error) {
      console.error('❌ Failed to send test message:', error);
      alert('Failed: ' + error.message);
    }
  };

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
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setHosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContactHost = (host) => {
    setActiveChat({ id: host.userId, name: host.name });
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
            <button onClick={testSignalR} className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              Test Chat: {signalRStatus}
            </button>
            {signalRStatus.includes('✅') && (
              <button onClick={sendTestMessage} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Send Test Message
              </button>
            )}
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
                        <MessageCircle size={16} className="chat-icon" />
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