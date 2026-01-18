import React, { useState, useEffect } from 'react';
import axios from 'axios';
import locationService from '../utils/locationService';
import api from '../utils/api';
import SubscriptionBadge from '../components/SubscriptionBadge';
import { Check, X, Ban } from 'lucide-react';

const API_BASE = 'https://api.festiveguest.com/api';
const ADMIN_EMAILS = ['admin@festiveguest.com', 'kalyanimatrimony@gmail.com'];

function Admin() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedingLocations, setSeedingLocations] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [locationsData, setLocationsData] = useState({});
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedStates, setExpandedStates] = useState({});
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    if (activeTab === 'subscriptions' || activeTab === 'payments') {
      fetchPayments();
      fetchUsers();
    }
    if (activeTab === 'locations') {
      fetchLocations();
    }
  }, [activeTab]);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await api.get('location/states-with-cities');
      setLocationsData(res.data || {});
    } catch (e) {
      console.error('Failed to fetch locations:', e);
      setLocationsData({});
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCity.trim()) {
      alert('Please enter a city name');
      return;
    }
    setLoadingLocations(true);
    try {
      await api.post('location/add', { state: selectedState, city: newCity.trim() });
      alert('City added successfully!');
      setShowAddCityModal(false);
      setNewCity('');
      fetchLocations();
    } catch (error) {
      alert('Failed to add city: ' + error.message);
      setLoadingLocations(false);
    }
  };

  const handleDeleteLocation = async (state, city) => {
    if (!confirm(`Delete ${city}, ${state}?`)) return;
    setLoadingLocations(true);
    try {
      await api.delete(`location/delete?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`);
      alert('Location deleted successfully!');
      fetchLocations();
    } catch (error) {
      alert('Failed to delete location: ' + error.message);
      setLoadingLocations(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('admin/listpayments');
      setPayments(res.data);
    } catch (e) {
      console.error('Failed to fetch payments:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('admin/users');
      setUsers(res.data || []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (userId, action) => {
    const statusMap = { approve: 'paid', reject: 'free', revoke: 'free', pending: 'pending' };
    const newStatus = statusMap[action] || action;
    
    setLoading(true);
    try {
      await api.post('subscription/update', {
        userId,
        subscriptionStatus: newStatus,
        paymentVerifiedTimestamp: newStatus === 'paid' ? new Date().toISOString() : null
      });
      alert(`Subscription updated to ${newStatus}!`);
      fetchUsers();
    } catch (error) {
      console.error('Subscription action error:', error);
      alert(`Failed to update subscription: ` + error.message);
      setLoading(false);
    }
  };

  const testLocationAPI = async () => {
    setTesting(true);
    try {
      const seedResponse = await api.post('seedlocations');
      const getResponse = await api.get('getlocations');
      setTestResult(`✅ APIs working! Seeded: ${seedResponse.data.count} locations. Retrieved: ${Object.keys(getResponse.data).length} states.`);
    } catch (error) {
      setTestResult(`❌ API Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSeedLocations = async () => {
    setSeedingLocations(true);
    try {
      const result = await locationService.seedLocations();
      alert(`Locations seeded successfully! ${result.count} locations added.`);
    } catch (error) {
      alert('Failed to seed locations: ' + error.message);
    } finally {
      setSeedingLocations(false);
    }
  };

  const handleVerify = async (paymentId, userId) => {
    try {
      await api.post('verifypayment', { paymentId, userId });
      alert('Payment verified and user updated!');
      fetchPayments();
    } catch (error) {
      alert('Verification failed: ' + error.message);
    }
  };

  return (
    <div className="admin-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Admin Dashboard</h2>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'subscriptions' ? '3px solid #667eea' : 'none',
            color: activeTab === 'subscriptions' ? '#667eea' : '#64748b',
            fontWeight: activeTab === 'subscriptions' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Subscription Management
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'payments' ? '3px solid #667eea' : 'none',
            color: activeTab === 'payments' ? '#667eea' : '#64748b',
            fontWeight: activeTab === 'payments' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Payment Verification
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'locations' ? '3px solid #667eea' : 'none',
            color: activeTab === 'locations' ? '#667eea' : '#64748b',
            fontWeight: activeTab === 'locations' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Location Management
        </button>
      </div>

      {/* Subscription Management Tab */}
      {activeTab === 'subscriptions' && (
        <div className="admin-section" key="subscriptions" style={{ minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1rem' }}>User Subscriptions</h3>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
                <option value="all">All Roles</option>
                <option value="Guest">Guest</option>
                <option value="Host">Host</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
                <option value="all">All Status</option>
                <option value="free">Free</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>Order</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading users...</p>
                  </td></tr>
                ) : users.filter(user => {
                  if (filterRole !== 'all' && user.userType !== filterRole) return false;
                  if (filterStatus !== 'all' && (user.subscriptionStatus || 'free') !== filterStatus) return false;
                  return true;
                }).sort((a, b) => {
                  let aVal, bVal;
                  if (sortBy === 'name') { aVal = a.name?.toLowerCase() || ''; bVal = b.name?.toLowerCase() || ''; }
                  else if (sortBy === 'email') { aVal = a.email?.toLowerCase() || ''; bVal = b.email?.toLowerCase() || ''; }
                  else if (sortBy === 'role') { aVal = a.userType || ''; bVal = b.userType || ''; }
                  else if (sortBy === 'status') { aVal = a.subscriptionStatus || 'free'; bVal = b.subscriptionStatus || 'free'; }
                  if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
                  return aVal < bVal ? 1 : -1;
                }).length > 0 ? users.filter(user => {
                  if (filterRole !== 'all' && user.userType !== filterRole) return false;
                  if (filterStatus !== 'all' && (user.subscriptionStatus || 'free') !== filterStatus) return false;
                  return true;
                }).sort((a, b) => {
                  let aVal, bVal;
                  if (sortBy === 'name') { aVal = a.name?.toLowerCase() || ''; bVal = b.name?.toLowerCase() || ''; }
                  else if (sortBy === 'email') { aVal = a.email?.toLowerCase() || ''; bVal = b.email?.toLowerCase() || ''; }
                  else if (sortBy === 'role') { aVal = a.userType || ''; bVal = b.userType || ''; }
                  else if (sortBy === 'status') { aVal = a.subscriptionStatus || 'free'; bVal = b.subscriptionStatus || 'free'; }
                  if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
                  return aVal < bVal ? 1 : -1;
                }).map(user => (
                    <tr key={user.userId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem' }}>{user.name}</td>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>{user.userType}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <SubscriptionBadge status={user.subscriptionStatus || 'free'} />
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <select
                          value={user.subscriptionStatus || 'free'}
                          onChange={(e) => handleSubscriptionAction(user.userId, e.target.value === 'paid' ? 'approve' : e.target.value === 'pending' ? 'pending' : 'reject')}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            background: user.subscriptionStatus === 'paid' ? '#d1fae5' : user.subscriptionStatus === 'pending' ? '#fef3c7' : '#f3f4f6',
                            color: user.subscriptionStatus === 'paid' ? '#065f46' : user.subscriptionStatus === 'pending' ? '#92400e' : '#374151'
                          }}
                        >
                          <option value="free">Free</option>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                    </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Verification Tab */}
      {activeTab === 'payments' && (
        <div className="admin-section" key="payments" style={{ minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Payment Verification</h3>
          <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>Review and verify user payment submissions for subscription upgrades.</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h4 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>No Pending Payments</h4>
              <p style={{ color: '#64748b', margin: 0 }}>All payment submissions have been processed. New submissions will appear here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>User ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>UPI Ref</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? payments.map(payment => (
                    <tr key={payment.rowKey} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem' }}>{payment.partitionKey}</td>
                      <td style={{ padding: '1rem' }}>{payment.type}</td>
                      <td style={{ padding: '1rem' }}>{payment.upiRef}</td>
                      <td style={{ padding: '1rem' }}>₹{payment.amount}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleVerify(payment.rowKey, payment.partitionKey)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No pending payments</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Location Management Tab */}
      {activeTab === 'locations' && (
        <div className="admin-section" key="locations" style={{ minHeight: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Location Management</h3>
          
          {loadingLocations ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading locations...</p>
            </div>
          ) : Object.keys(locationsData).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p>No locations found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.keys(locationsData).sort().map(state => (
                <div key={state} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpandedStates(prev => ({ ...prev, [state]: !prev[state] }))}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#f8fafc',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>📍 {state} ({locationsData[state].length})</span>
                    <span>{expandedStates[state] ? '▼' : '▶'}</span>
                  </button>
                  {expandedStates[state] && (
                    <div style={{ padding: '1rem', background: 'white', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {[...locationsData[state]].sort().map(city => (
                        <div key={city} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                          <span>{city}</span>
                          <button
                            onClick={() => handleDeleteLocation(state, city)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              fontSize: '1.2rem',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => { setSelectedState(state); setShowAddCityModal(true); }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                      >
                        + Add City
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddCityModal(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', minWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>Add City to {selectedState}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>State</label>
              <input
                type="text"
                value={selectedState}
                disabled
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: '#f8fafc', color: '#64748b' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>City Name</label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Enter city name"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAddCityModal(false); setNewCity(''); }}
                style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCity}
                disabled={loadingLocations}
                style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600' }}
              >
                {loadingLocations ? 'Adding...' : 'Add City'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;