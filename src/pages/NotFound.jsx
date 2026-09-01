import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

function NotFound() {
  const navigate = useNavigate();
  useSEO({ title: 'Page Not Found', noindex: true });

  return (
    <div className="profile-container text-center" style={{ padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem' }}>404</h1>
      <h2 style={{ margin: '0 0 0.75rem' }}>Page Not Found</h2>
      <p style={{ color: '#64748b', maxWidth: 420, margin: '0 auto 1.5rem' }}>
        The page you're looking for doesn't exist or may have moved.
      </p>
      <button onClick={() => navigate('/')} className="btn btn-primary">
        Back to Home
      </button>
    </div>
  );
}

export default NotFound;
