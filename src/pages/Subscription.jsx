import React, { useState, useEffect } from 'react';
import { Crown, Check, MessageCircle, RefreshCw, Users, Gift } from 'lucide-react';
import api from '../utils/api';

function Subscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [loading, setLoading] = useState(true);
  const [referralPoints, setReferralPoints] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [userType, setUserType] = useState('Guest');

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await api.get('user/profile');
      setSubscriptionStatus(res.data.subscriptionStatus || 'free');
      setReferralPoints(res.data.referralPoints || 0);
      setReferralCode(res.data.referralCode || '');
      setUserType(res.data.userType || 'Guest');
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    const message = encodeURIComponent('I want to upgrade my subscription.');
    window.open(`https://wa.me/919966888484?text=${message}`, '_blank');
  };

  const getStatusBadge = () => {
    const badges = {
      free: { text: 'Free', color: '#64748b', bg: '#f1f5f9' },
      pending: { text: 'Pending Approval', color: '#f59e0b', bg: '#fef3c7' },
      paid: { text: '✓ Premium', color: '#10b981', bg: '#dcfce7' }
    };
    const badge = badges[subscriptionStatus] || badges.free;
    return (
      <span style={{ 
        fontWeight: 'bold', 
        color: badge.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        background: badge.bg
      }}>
        {badge.text}
      </span>
    );
  };

  const freeFeatures = [
    'View host profiles',
    'Basic search filters',
    'Send up to 5 messages per day',
    'View public reviews'
  ];

  const premiumFeatures = [
    'Unlimited messaging',
    'Advanced search filters',
    'Priority support',
    'Verified badge on profile',
    'See who viewed your profile',
    'Ad-free experience'
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading">Loading subscription details...</div>
      </div>
    );
  }

  const isPremium = subscriptionStatus === 'paid';
  const isPending = subscriptionStatus === 'pending';
  const price = userType === 'Host' ? 299 : 199;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
          <Crown size={32} style={{ color: isPremium ? '#f59e0b' : '#64748b' }} />
          Subscription
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Current Status: {getStatusBadge()}
        </p>
        {isPending && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '0.5rem',
            color: '#92400e',
            maxWidth: '500px',
            margin: '1rem auto 0'
          }}>
            ⏳ Your upgrade request is pending admin approval. You'll be notified once approved.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Free Plan */}
        <div style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Free Plan</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Basic features for casual users</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹0</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Forever free</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {freeFeatures.map((feature, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Check size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem' }}>{feature}</span>
              </div>
            ))}
          </div>

          {!isPremium && !isPending && (
            <div style={{ 
              padding: '0.75rem', 
              background: '#f1f5f9', 
              borderRadius: '0.5rem',
              textAlign: 'center',
              color: '#64748b',
              fontWeight: '600'
            }}>
              Current Plan
            </div>
          )}
        </div>

        {/* Premium Plan */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '2px solid #667eea',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
          color: 'white',
          position: 'relative'
        }}>
          {isPremium && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: '#f59e0b',
              color: 'white',
              padding: '0.25rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
            }}>
              ACTIVE
            </div>
          )}

          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={24} style={{ color: '#f59e0b' }} />
            Premium Plan
          </h2>
          <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>Unlock all features</p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹{price}</div>
            <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Per month • Non-refundable</div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {premiumFeatures.map((feature, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Check size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem' }}>{feature}</span>
              </div>
            ))}
          </div>

          {!isPremium && !isPending ? (
            <button
              onClick={handleUpgrade}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <MessageCircle size={20} />
              Upgrade via WhatsApp
            </button>
          ) : isPending ? (
            <div style={{ 
              padding: '0.875rem', 
              background: 'rgba(251, 191, 36, 0.2)', 
              borderRadius: '0.5rem',
              textAlign: 'center',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              ⏳ Pending Approval
            </div>
          ) : (
            <div style={{ 
              padding: '0.875rem', 
              background: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '0.5rem',
              textAlign: 'center',
              fontWeight: '600',
              backdropFilter: 'blur(10px)'
            }}>
              ✓ You're Premium!
            </div>
          )}
        </div>
      </div>

      {/* Referral Program Section */}
      {!isPremium && (
        <div style={{
          marginTop: '3rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '2px solid #10b981',
          borderRadius: '1rem',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Users size={40} style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>🎁 Get Premium FREE!</h3>
            <p style={{ opacity: 0.9, margin: 0, fontSize: '1.05rem', fontWeight: '500' }}>
              Earn 100 points for each friend who registers and subscribes using your referral code. Collect 500 points to unlock 3 months of Premium FREE!
            </p>
          </div>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: '0.75rem', 
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {referralPoints} / 500
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Referral Points</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
                {referralPoints >= 500 ? '🎉 Ready to redeem!' : `Need ${500 - referralPoints} more points (${Math.ceil((500 - referralPoints) / 100)} referrals)`}
              </div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.3)', 
              borderRadius: '0.5rem', 
              height: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: 'white', 
                height: '100%', 
                width: `${Math.min(100, (referralPoints / 500) * 100)}%`,
                transition: 'width 0.3s ease',
                borderRadius: '0.5rem'
              }} />
            </div>
          </div>

          {referralCode && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Your Referral Code</div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                display: 'inline-block',
                backdropFilter: 'blur(10px)',
                marginBottom: '1rem'
              }}>
                {referralCode}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {referralPoints >= 500 ? (
                  <button
                    onClick={() => window.location.href = '/referrals'}
                    style={{
                      padding: '0.75rem 2rem',
                      background: 'white',
                      color: '#10b981',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Gift size={20} />
                    Redeem 500 Points Now!
                  </button>
                ) : (
                  <a 
                    href="/referrals" 
                    style={{ 
                      color: 'white', 
                      textDecoration: 'underline',
                      fontSize: '0.95rem',
                      opacity: 0.9
                    }}
                  >
                    View detailed referral stats →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How to Upgrade Section */}
      {!isPremium && !isPending && (
        <div style={{
          marginTop: '3rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '1rem',
          padding: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>How to Upgrade via Payment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: '#667eea', 
                color: 'white', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 0.75rem',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>1</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Click "Upgrade via WhatsApp"</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: '#667eea', 
                color: 'white', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 0.75rem',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>2</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Send payment screenshot</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: '#667eea', 
                color: 'white', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 0.75rem',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>3</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Get verified within 24 hours</p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Status Button */}
      {isPending && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={fetchSubscriptionStatus}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#5856eb'}
            onMouseOut={(e) => e.target.style.background = '#667eea'}
          >
            <RefreshCw size={18} />
            Refresh Status
          </button>
        </div>
      )}
    </div>
  );
}

export default Subscription;
