import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Users, Copy, Share2, Gift, TrendingUp, Clock, Crown, MessageCircle, ArrowLeft, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../utils/api';
import GlassDialog from '../components/posts/GlassDialog';
import ProgressRing from '../components/ProgressRing';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Profile.css';

const GOAL = 500;
const EASE = [0.22, 1, 0.36, 1];
const rise = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: EASE, delay } });

function Referrals() {
  useSEO({ title: 'Refer & Earn', noindex: true });
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type, id: Date.now() });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('user/profile'),
        api.get('referralpoints/history').catch(() => ({ data: [] })),
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

  const referralLink = `${window.location.origin}/r/${referralCode}`;
  const shareText = `Join FestiveGuest — trusted local hosts for life's important trips. Use my referral code ${referralCode} 🎁\n\nRegister here: ${referralLink}`;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast(t('codeCopied'));
  };
  const shareViaWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  const shareNative = () => {
    if (navigator.share) navigator.share({ text: shareText }).catch(() => {});
    else { navigator.clipboard.writeText(shareText); showToast('Invite message copied'); }
  };

  const handleRedeem = async () => {
    if (subscriptionStatus === 'paid') { showToast(t('alreadySubscribed'), 'error'); return; }
    if (referralPoints < GOAL) { showToast(t('needPointsToRedeem'), 'error'); return; }
    setRedeeming(true);
    try {
      const res = await api.post('referralpoints/redeem');
      if (res.data.success) {
        showToast(t('redemptionSuccess'));
        setShowRedeemModal(false);
        await fetchData();
      }
    } catch (err) {
      showToast(t('redemptionFailed').replace('{error}', err.response?.data?.message || err.message), 'error');
    } finally {
      setRedeeming(false);
    }
  };

  const price = userType === 'Host' ? 299 : 199;
  const pointsNeeded = Math.max(0, GOAL - referralPoints);
  const referralsNeeded = Math.ceil(pointsNeeded / 100);
  const progress = Math.min(100, Math.round((referralPoints / GOAL) * 100));
  const steps = [1, 2, 3, 4, 5, 6].map((n) => [t(`step${n}Title`).replace(/^Step\s*\d+\s*:\s*/i, ''), t(`step${n}Desc`).replace('{price}', price)]);

  const page = (children) => (
    <MotionConfig reducedMotion="user">
      <div className="pf">
        <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <div className="pf-shell">{children}</div>
      </div>
    </MotionConfig>
  );

  if (loading) return page(<div className="pf-state"><span className="rg-spinner pb-spinner-light" /> {t('loadingReferralData')}</div>);

  return page(
    <>
      <Link to="/profile" className="pf-back"><ArrowLeft size={15} /> My profile</Link>

      {/* ═════ Rewards hero ═════ */}
      <motion.section className="pf-hero rf-hero" {...rise()}>
        <div className="rf-hero-ring">
          <ProgressRing pct={progress} label={`${referralPoints}`} className="rf-ring" />
          <span>of {GOAL} points</span>
        </div>
        <div className="rf-hero-text">
          <p className="rf-kicker"><Gift size={14} /> {t('referEarn')}</p>
          <h1>{referralPoints >= GOAL ? 'You’ve unlocked free Premium! 🎉' : `${pointsNeeded} points to free Premium`}</h1>
          <p className="rf-sub">
            {referralPoints >= GOAL
              ? t('readyToRedeem')
              : `That’s about ${referralsNeeded} more friend${referralsNeeded === 1 ? '' : 's'} joining with your code — worth ₹${price} of Premium.`}
          </p>
          <div className="rf-ticket">
            <div>
              <small>{t('yourReferralCode')}</small>
              <code>{referralCode || '—'}</code>
            </div>
            <div className="rf-ticket-actions">
              <button type="button" className="pb-icon-btn" onClick={copyReferralCode} disabled={!referralCode} aria-label="Copy code" title={t('copy')}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
              <button type="button" className="rg-btn rg-btn-sm rf-wa" onClick={shareViaWhatsApp} disabled={!referralCode}><MessageCircle size={14} /> WhatsApp</button>
              <button type="button" className="pb-icon-btn" onClick={shareNative} disabled={!referralCode} aria-label={t('share')} title={t('share')}><Share2 size={15} /></button>
            </div>
          </div>
          {referralPoints >= GOAL && subscriptionStatus !== 'paid' && (
            <button type="button" className="rg-btn rg-btn-primary pf-btn rf-redeem" onClick={() => setShowRedeemModal(true)}><Crown size={15} /> {t('redeemPoints')}</button>
          )}
        </div>
      </motion.section>

      {/* ═════ Stats ═════ */}
      <motion.div className="rf-stats" {...rise(0.05)}>
        <div><Users size={18} /><strong>{successfulReferrals}</strong><span>{t('referrals')}</span></div>
        <div><TrendingUp size={18} /><strong>{referralPoints}</strong><span>{t('points')}</span></div>
        <div><Crown size={18} /><strong>₹{price}</strong><span>{t('goal')}</span></div>
      </motion.div>

      <div className="pf-grid">
        <motion.section className="pf-card" {...rise(0.1)}>
          <header className="pf-card-head"><h2><Share2 size={16} /> {t('howReferralWorks')}</h2></header>
          <ol className="pb-how rf-steps">
            {steps.map(([title, text], i) => (
              <li key={title}><span className="pb-how-num">{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>
            ))}
          </ol>
          <p className="rf-tip">{t('proTip')}</p>
        </motion.section>

        <motion.section className="pf-card" {...rise(0.14)}>
          <header className="pf-card-head"><h2><Clock size={16} /> {t('pointsHistory')}</h2><span className="pf-count">{pointsHistory.length}</span></header>
          {pointsHistory.length === 0 ? (
            <div className="rf-empty"><Users size={28} /><p>{t('noReferralHistory')}</p></div>
          ) : (
            <ul className="rf-history">
              {pointsHistory.map((item, index) => {
                const earned = item.type === 'earned';
                return (
                  <li key={index}>
                    <span className={`rf-amt${earned ? ' is-earned' : ''}`}>{earned ? '+' : '−'}{Math.abs(item.points)}</span>
                    <div>
                      <strong>{earned ? t('earned') : t('redeemed')} {Math.abs(item.points)} {t('points')}</strong>
                      <small>{earned ? t('earnedPoints').replace('{user}', item.referredUserName || item.userName || 'User') : (item.description || t('subscriptionActivated'))}</small>
                    </div>
                    <time>{new Date(item.createdDate || item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} className={`rg-toast is-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}
            initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
            <span className="rg-toast-icon">{toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassDialog open={showRedeemModal} onClose={() => !redeeming && setShowRedeemModal(false)} size="sm" icon={<Crown size={17} />} title={t('redeemYourPoints')}
        footer={(
          <>
            <button type="button" className="rg-btn rg-btn-ghost" onClick={() => setShowRedeemModal(false)} disabled={redeeming}>{t('cancel')}</button>
            <button type="button" className="rg-btn rg-btn-primary pb-submit" onClick={handleRedeem} disabled={redeeming}>{redeeming ? <><span className="rg-spinner" /> {t('redeeming')}</> : t('confirmRedemption')}</button>
          </>
        )}>
        <div className="rf-redeem-box">
          <small>{t('currentBalance')}</small>
          <strong>{referralPoints} points</strong>
          <p className="rf-redeem-h">{t('redeemFor')}</p>
          <p className="rf-ok">✓ {t('monthsPremium')}</p>
          <p className="rf-ok">✓ {t('worth').replace('{price}', price).replace('{userType}', userType)}</p>
          <p className="rf-redeem-h">{t('afterRedemption')}</p>
          <p>• {t('pointsZero')}</p>
          <p>• {t('subscriptionActive')}</p>
        </div>
      </GlassDialog>
    </>,
  );
}

export default Referrals;
