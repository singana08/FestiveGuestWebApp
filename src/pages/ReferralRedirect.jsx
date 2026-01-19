import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ReferralRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Store referral code in sessionStorage
    if (code) {
      sessionStorage.setItem('pendingReferralCode', code);
    }
    
    // Redirect to landing page which will show registration modal
    navigate('/?register=true', { replace: true });
  }, [code, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid #f3f4f6', 
        borderTop: '4px solid #667eea', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}></div>
      <p style={{ color: '#64748b' }}>Redirecting to registration...</p>
    </div>
  );
}

export default ReferralRedirect;
