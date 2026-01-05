import React, { useState, useEffect } from 'react';
import axios from 'axios';
import locationService from '../utils/locationService';
import api from '../utils/api';

const API_BASE = 'https://api.festiveguest.com/api';

function Admin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedingLocations, setSeedingLocations] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('listpayments');
      setPayments(res.data);
    } catch (e) {
      console.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const testLocationAPI = async () => {
    setTesting(true);
    try {
      // Test seed API
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
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      
      {/* Location Management Section */}
      <div className="admin-section" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
        <h3>Location Management</h3>
        <p>Test and seed the locations table with initial data.</p>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={testLocationAPI}
            disabled={testing}
            style={{ marginRight: '1rem' }}
          >
            {testing ? 'Testing APIs...' : 'Test Location APIs'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSeedLocations}
            disabled={seedingLocations}
          >
            {seedingLocations ? 'Seeding Locations...' : 'Seed Locations Table'}
          </button>
        </div>
        {testResult && (
          <div style={{ padding: '0.5rem', background: testResult.includes('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '0.25rem', fontSize: '0.9rem' }}>
            {testResult}
          </div>
        )}
      </div>

      {/* Payment Verification Section */}
      <div className="admin-section">
        <h3>Verify Payments</h3>
        {loading ? <p>Loading...</p> : (
          <div className="payment-list">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Type</th>
                  <th>UPI Ref</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map(payment => (
                  <tr key={payment.rowKey}>
                    <td>{payment.partitionKey}</td>
                    <td>{payment.type}</td>
                    <td>{payment.upiRef}</td>
                    <td>₹{payment.amount}</td>
                    <td>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleVerify(payment.rowKey, payment.partitionKey)}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No pending payments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
