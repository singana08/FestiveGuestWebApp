import React, { useState, useEffect } from 'react';
import { Users, Copy, Share2, Gift, TrendingUp, Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../utils/api';

function Referrals() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [referralPoints, setReferralPoints] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [userType, setUserType] = useState('Guest');
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('user/profile'),
        api.get('referralpoints/history').catch(() => ({ data: [] }))
      ]);
      
      setReferralPoints(profileRes.data.referralPoints || 0);
      setReferralCode(profileRes.data.referralCode || '');
      setSuccessfulReferrals(profileRes.data.successfulReferrals || 0);
      setUserType(profileRes.data.userType || 'Guest');
      setSubscriptionStatus(profileRes.data.subscriptionStatus || 'free');
      setPointsHistory(historyRes.data || []);
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
      showToast(t('failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    showToast(t('codeCopied'), 'success');
  };

  const shareViaWhatsApp = () => {
    const referralLink = `${window.location.origin}/r/${referralCode}`;
    const message = `Join Local Host Connect using my referral code ${referralCode}! 🎁\n\nClick here to register: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRedeem = async () => {
    if (subscriptionStatus === 'paid') {
      showToast(t('alreadySubscribed'), 'error');
      return;
    }
    
    if (referralPoints < 500) {
      showToast(t('needPointsToRedeem'), 'error');
      return;
    }

    setRedeeming(true);
    try {
      const res = await api.post('referralpoints/redeem');
      if (res.data.success) {
        showToast(t('redemptionSuccess'), 'success');
        setShowRedeemModal(false);
        await fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showToast(t('redemptionFailed').replace('{error}', msg), 'error');
    } finally {
      setRedeeming(false);
    }
  };

  const price = userType === 'Host' ? 299 : 199;
  const pointsNeeded = Math.max(0, 500 - referralPoints);
  const referralsNeeded = Math.ceil(pointsNeeded / 100);
  const progressPercent = Math.min(100, (referralPoints / 500) * 100);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading">{t('loadingReferralData')}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontSize: '0.9rem',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          {toast.message}
        </div>
      )}

      <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
        <Gift size={28} style={{ color: '#667eea' }} />
        {t('referEarn')}
      </h1>

      {/* Points Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        color: 'white',
        marginBottom: '1rem',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {referralPoints} 🎁
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.9 }}>{t('yourReferralPoints')}</div>
        </div>

        {/* Two columns: Progress Bar and Referral Code */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Progress Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>{t('progressToFree')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {referralPoints}/500 {t('points')}
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '0.5rem',
              height: '8px',
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                background: 'white',
                height: '100%',
                width: `${progressPercent}%`,
                transition: 'width 0.3s ease',
                borderRadius: '0.5rem'
              }} />
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              {referralPoints >= 500 ? t('readyToRedeem') : t('needMorePoints').replace('{points}', pointsNeeded).replace('{referrals}', referralsNeeded)}
            </div>
          </div>

          {/* Referral Code Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>{t('yourReferralCode')}</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '0.75rem'
            }}>
              {referralCode}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={copyReferralCode}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Copy size={14} />
                {t('copy')}
              </button>
              <button
                onClick={shareViaWhatsApp}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Share2 size={14} />
                {t('share')}
              </button>
            </div>
          </div>
        </div>

        {referralPoints < 500 ? (
          <div style={{ textAlign: 'center', fontSize: '0.95rem' }}>
            Need {pointsNeeded} more points ({referralsNeeded} more referral{referralsNeeded > 1 ? 's' : ''})
          </div>
        ) : (
          <button
            onClick={() => setShowRedeemModal(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
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
              gap: '0.5rem'
            }}
          >
            <Gift size={18} />
            {t('redeemPoints')}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Users size={24} style={{ color: '#667eea', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
            {successfulReferrals}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t('referrals')}</div>
        </div>

        <div style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <TrendingUp size={24} style={{ color: '#10b981', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
            {referralPoints}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t('points')}</div>
        </div>

        <div style={{
          background: 'white',
          border: '2px solid #e2e8f0',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Gift size={24} style={{ color: '#f59e0b', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
            ₹{price}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t('goal')}</div>
        </div>
      </div>

      {/* How it Works Section */}
      <div style={{
        background: 'white',
        border: '2px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Share2 size={20} />
          {t('howReferralWorks')}
        </h2>        <div style={{
          background: '#f0fdf4',
          border: '1px solid #16a34a',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#15803d', fontSize: '0.95rem' }}>{t('howItWorksTitle')}</h3>
          <div style={{ color: '#15803d', lineHeight: '1.8', fontSize: '0.85rem' }}>
            <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #16a34a' }}>
              <strong>{t('step1Title')}</strong>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>{t('step1Desc')}</p>
            </div>
            
            <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #16a34a' }}>
              <strong>{t('step2Title')}</strong>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>{t('step2Desc')}</p>
            </div>
            
            <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #16a34a' }}>
              <strong>{t('step3Title')}</strong>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>{t('step3Desc')}</p>
            </div>
            
            <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #16a34a' }}>
              <strong>{t('step4Title')}</strong>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>{t('step4Desc')}</p>
            </div>
            
            <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #16a34a' }}>
              <strong>{t('step5Title')}</strong>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>{t('step5Desc')}</p>
            </div>
            
            <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #16a34a' }}>
              <strong>{t('step6Title')}</strong>
              <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>{t('step6Desc').replace('{price}', price)}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(22, 163, 74, 0.1)', borderRadius: '0.375rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d', fontWeight: '600' }}>
              {t('proTip')}
            </p>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div style={{
        background: 'white',
        border: '2px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Clock size={20} />
          {t('pointsHistory')}
        </h2>

        {pointsHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>{t('noReferralHistory')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pointsHistory.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.125rem', fontSize: '0.9rem' }}>
                    {item.type === 'earned' ? t('earned') : t('redeemed')} {Math.abs(item.points)} {t('points')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {item.type === 'earned' ? t('earnedPoints').replace('{user}', item.referredUserName || item.userName || 'User') : (item.description || t('subscriptionActivated'))}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                  {new Date(item.createdDate || item.timestamp).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowRedeemModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>{t('redeemYourPoints')}</h2>

            <div style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('currentBalance')}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {referralPoints} points
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  {t('redeemFor')}
                </div>
                <div style={{ color: '#15803d', marginBottom: '0.25rem' }}>
                  ✓ {t('monthsPremium')}
                </div>
                <div style={{ color: '#15803d' }}>
                  ✓ {t('worth').replace('{price}', price).replace('{userType}', userType)}
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1rem',
                marginTop: '1rem',
                color: '#64748b',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{t('afterRedemption')}</div>
                <div>• {t('pointsZero')}</div>
                <div>• {t('subscriptionActive')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowRedeemModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  opacity: redeeming ? 0.5 : 1
                }}
              >
                {redeeming ? t('redeeming') : t('confirmRedemption')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Referrals;
