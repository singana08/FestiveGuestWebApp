import React, { useState } from 'react';
import api from '../utils/api';
import locationService from '../utils/locationService';

const ApiTest = () => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testApiConnectivity = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      addResult('🔍 Testing API connectivity...', 'info');
      
      // Test 1: Basic API health check
      try {
        addResult(`📡 API Base URL: ${api.defaults.baseURL}`, 'info');
        const healthResponse = await api.get('health');
        addResult('✅ API Health Check: SUCCESS', 'success');
      } catch (error) {
        addResult(`❌ API Health Check: ${error.message}`, 'error');
      }

      // Test 2: Location service
      try {
        addResult('🌍 Testing location service...', 'info');
        const locations = await locationService.getLocations();
        const stateCount = Object.keys(locations || {}).length;
        addResult(`✅ Locations loaded: ${stateCount} states found`, 'success');
      } catch (error) {
        addResult(`❌ Location service: ${error.message}`, 'error');
      }

      // Test 3: Direct location API call
      try {
        addResult('🔗 Testing direct location API...', 'info');
        const directResponse = await api.get('location/states-with-cities');
        const directStateCount = Object.keys(directResponse.data || {}).length;
        addResult(`✅ Direct API call: ${directStateCount} states found`, 'success');
      } catch (error) {
        addResult(`❌ Direct API call: ${error.message}`, 'error');
      }

    } catch (error) {
      addResult(`💥 Test suite failed: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <h2>🔧 API Connectivity Test</h2>
      <p>Use this tool to test your API connectivity and location loading.</p>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={testApiConnectivity} 
          disabled={testing}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: testing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: testing ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          {testing ? '🔄 Testing...' : '🚀 Run Tests'}
        </button>
        
        <button 
          onClick={clearResults}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear Results
        </button>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '200px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {results.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
            Click "Run Tests" to start testing your API connectivity...
          </p>
        ) : (
          results.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '0.5rem',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: 
                  result.type === 'success' ? '#d4edda' :
                  result.type === 'error' ? '#f8d7da' : '#d1ecf1',
                color:
                  result.type === 'success' ? '#155724' :
                  result.type === 'error' ? '#721c24' : '#0c5460'
              }}
            >
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                [{result.timestamp}]
              </span>
              {' '}
              {result.message}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
        <p><strong>Environment:</strong> {process.env.NODE_ENV || 'production'}</p>
        <p><strong>Current API Base:</strong> {api.defaults.baseURL}</p>
      </div>
    </div>
  );
};

export default ApiTest;