import React, { useState } from 'react';
import storageService from '../utils/storageService';

const SasTokenTest = () => {
  const [fileName, setFileName] = useState('festive-logo.png');
  const [container, setContainer] = useState('logos');
  const [sasUrl, setSasUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testSasToken = async () => {
    setLoading(true);
    setError('');
    setSasUrl('');
    
    try {
      const url = await storageService.getSasUrl(fileName, container);
      setSasUrl(url);
    } catch (err) {
      setError(err.message || 'Failed to fetch SAS URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔐 SAS Token Test</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          File Name:
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            placeholder="festive-logo.png"
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Container:
          <input
            type="text"
            value={container}
            onChange={(e) => setContainer(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            placeholder="logos"
          />
        </label>
      </div>

      <button
        onClick={testSasToken}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#ff6b35',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '1rem'
        }}
      >
        {loading ? 'Loading...' : 'Generate SAS URL'}
      </button>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          ❌ Error: {error}
        </div>
      )}

      {sasUrl && (
        <div>
          <h3>✅ SAS URL Generated:</h3>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            wordBreak: 'break-all',
            marginBottom: '1rem'
          }}>
            {sasUrl}
          </div>

          <h3>Image Preview:</h3>
          <img
            src={sasUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              setError('Failed to load image');
            }}
          />
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
        <h4>Quick Tests:</h4>
        <button onClick={() => { setFileName('festive-logo.png'); setContainer('logos'); }} style={{ margin: '0.25rem', padding: '0.5rem' }}>
          Test Logo
        </button>
        <button onClick={() => { setFileName('festive-login-logo.png'); setContainer('logos'); }} style={{ margin: '0.25rem', padding: '0.5rem' }}>
          Test Login Logo
        </button>
      </div>
    </div>
  );
};

export default SasTokenTest;
