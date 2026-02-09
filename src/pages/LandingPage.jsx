import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DisclaimerModal from '../components/DisclaimerModal';
import { useLanguage } from '../i18n/LanguageContext';

const LandingPage = ({ user }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  // Check for register parameter in URL
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      handleRoleSelection('Guest'); // Default to Guest, user can change in modal
    }
  }, [searchParams]);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setShowDisclaimerModal(true);
  };

  // Check for referral code in URL and store it
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      sessionStorage.setItem('pendingReferralCode', refCode.toUpperCase());
    }
  }, [searchParams]);

  const getDashboardRoute = () => {
    return '/posts';
  };

  const getDashboardText = () => {
    return t('goToPosts');
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">{t('connectWithLocalHosts')}</h1>
          <p className="hero-subtitle">
            {t('experienceAuthentic')}
          </p>
          <div className="hero-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => handleRoleSelection('Guest')}>
                  {t('joinAsGuest')}
                </button>
                <button className="btn btn-secondary" onClick={() => handleRoleSelection('Host')}>
                  {t('joinAsHost')}
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate(getDashboardRoute())}>
                {getDashboardText()}
              </button>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="festival-card">
            <h3>🌍 {t('travelConnect')}</h3>
            <p>{t('stayWithLocals')}</p>
            <br />
            <p>✈️ Safely explore new places</p>
            <p>🤝 Connect with trusted hosts</p>
            <p>🗺️ Discover hidden gems</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>{t('whyChooseTitle')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏷️</div>
              <h3>{t('purposeBasedStays')}</h3>
              <p>{t('purposeBasedStaysDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🆕</div>
              <h3>{t('firstTimeIndicator')}</h3>
              <p>{t('firstTimeIndicatorDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>{t('hostComfortPrefs')}</h3>
              <p>{t('hostComfortPrefsDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗣️</div>
              <h3>{t('languageComfort')}</h3>
              <p>{t('languageComfortDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3>{t('emergencyStays')}</h3>
              <p>{t('emergencyStaysDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>{t('authenticCuisine')}</h3>
              <p>{t('authenticCuisineDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Travel Types Section */}
      <section className="testimonials">
        <div className="container">
          <h2>{t('perfectForTitle')}</h2>
          <div className="travel-types-grid">
            <div className="travel-card">
              <div className="feature-icon">💼</div>
              <h3>{t('businessWork')}</h3>
              <p>{t('businessWorkDesc')}</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🏥</div>
              <h3>{t('adventureLeisure')}</h3>
              <p>{t('adventureLeisureDesc')}</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🎉</div>
              <h3>{t('festivalsEvents')}</h3>
              <p>{t('festivalsEventsDesc')}</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🎓</div>
              <h3>{t('educationResearch')}</h3>
              <p>{t('educationResearchDesc')}</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">📊</div>
              <h3>{t('familyVisits')}</h3>
              <p>{t('familyVisitsDesc')}</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">⚡</div>
              <h3>{t('culturalExchange')}</h3>
              <p>{t('culturalExchangeDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="features">
        <div className="container">
          <h2>{t('whoIsThisForTitle')}</h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
            {t('whoIsThisForBody')}
          </p>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontSize: '1.05rem', marginBottom: '1rem', fontWeight: '500' }}>{t('whoIsThisForIntro')}</p>
            <ul style={{ fontSize: '1rem', lineHeight: '1.8', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              <li>{t('whoIsThisForPoint1')}</li>
              <li>{t('whoIsThisForPoint2')}</li>
              <li>{t('whoIsThisForPoint3')}</li>
              <li>{t('whoIsThisForPoint4')}</li>
            </ul>
            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', textAlign: 'center', marginTop: '1.5rem' }}>
              {t('whoIsThisForClosing')}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>{t('howItWorksTitle')}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>{t('howItWorksStep1')}</h3>
              <p>{t('howItWorksStep1Desc')}</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>{t('howItWorksStep2')}</h3>
              <p>{t('howItWorksStep2Desc')}</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>{t('howItWorksStep3')}</h3>
              <p>{t('howItWorksStep3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2>{t('testimonialsTitle')}</h2>
          <div className="testimonials-compact-grid">
            <div className="testimonial-compact">
              <p>{t('testimonial1')}</p>
              <div className="testimonial-author">{t('testimonial1Author')}</div>
            </div>
            <div className="testimonial-compact">
              <p>{t('testimonial2')}</p>
              <div className="testimonial-author">{t('testimonial2Author')}</div>
            </div>
            <div className="testimonial-compact">
              <p>{t('testimonial3')}</p>
              <div className="testimonial-author">{t('testimonial3Author')}</div>
            </div>
            <div className="testimonial-compact">
              <p>{t('testimonial4')}</p>
              <div className="testimonial-author">{t('testimonial4Author')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Life Story Section */}
      <section className="how-it-works">
        <div className="container">
          <h2>{t('realLifeStoryTitle')}</h2>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              {t('realLifeStoryPara1')}
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              {t('realLifeStoryPara2')}
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1rem', fontWeight: '500' }}>
              {t('realLifeStoryPara3')}
            </p>
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginTop: '1.5rem', fontWeight: '500' }}>
              {t('realLifeStoryClosing')}
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Trust Section */}
      <section className="features">
        <div className="container">
          <h2>{t('safetyTrustTitle')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>{t('shareYourPlans')}</h3>
              <p>{t('shareYourPlansDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>{t('meetPublicFirst')}</h3>
              <p>{t('meetPublicFirstDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>{t('videoCallBefore')}</h3>
              <p>{t('videoCallBeforeDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>{t('keepEmergencyContacts')}</h3>
              <p>{t('keepEmergencyContactsDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>{t('trustInstincts')}</h3>
              <p>{t('trustInstinctsDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>{t('securePayment')}</h3>
              <p>{t('securePaymentDesc')}</p>
            </div>
          </div>
          <div style={{ maxWidth: '800px', margin: '3rem auto 0', textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', fontStyle: 'italic' }}>
              {t('dignityStatement')}
            </p>
          </div>
        </div>
      </section>



      {/* Host Benefits */}
      <section className="how-it-works">
        <div className="container">
          <h2>{t('hostBenefitsTitle')}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">🤝</div>
              <h3>{t('earnIncome')}</h3>
              <p>{t('earnIncomeDesc')}</p>
            </div>
            <div className="step">
              <div className="step-number">🧭</div>
              <h3>{t('meetPeople')}</h3>
              <p>{t('meetPeopleDesc')}</p>
            </div>
            <div className="step">
              <div className="step-number">🌐</div>
              <h3>{t('shareCulture')}</h3>
              <p>{t('shareCultureDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Host Eligibility Section */}
      <section className="features">
        <div className="container">
          <h2>{t('hostEligibilityTitle')}</h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
            {t('hostEligibilityIntro')}
          </p>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontSize: '1.05rem', marginBottom: '1rem', fontWeight: '500' }}>{t('hostEligibilitySubtitle')}</p>
            <ul style={{ fontSize: '1rem', lineHeight: '1.8', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              <li>{t('hostEligibilityPoint1')}</li>
              <li>{t('hostEligibilityPoint2')}</li>
              <li>{t('hostEligibilityPoint3')}</li>
            </ul>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>{t('hostEligibilityClosing1')}</p>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>{t('hostEligibilityClosing2')}</p>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.8', fontWeight: '500' }}>{t('hostEligibilityClosing3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Hosts Earn Section */}
      <section className="how-it-works">
        <div className="container">
          <h2>{t('howHostsEarnTitle')}</h2>
          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              {t('howHostsEarnPara1')}
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
              {t('howHostsEarnPara2')}
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>{t('howHostsEarnPara3')}</p>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>{t('howHostsEarnPara4')}</p>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>{t('howHostsEarnPara5')}</p>
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', fontWeight: '500' }}>
              {t('howHostsEarnClosing')}
            </p>
          </div>
        </div>
      </section>

      {/* Safety Guidelines */}
      <section className="features">
        <div className="container">
          <h2>🛡️ Safety Guidelines - Please Read Before Meeting</h2>
          <div className="safety-grid">
            <div className="safety-card">
              <div className="feature-icon">📱</div>
              <h3>Share Your Plans</h3>
              <p>Always inform family/friends about your travel plans, host details, and expected return time</p>
            </div>
            <div className="safety-card">
              <div className="feature-icon">🌍</div>
              <h3>Meet in Public First</h3>
              <p>Arrange initial meetings in public places like cafes or restaurants before going to private locations</p>
            </div>
            <div className="safety-card">
              <div className="feature-icon">📞</div>
              <h3>Video Call Before Meeting</h3>
              <p>Have a video conversation to verify identity and get comfortable before meeting in person</p>
            </div>
            <div className="safety-card">
              <div className="feature-icon">📲</div>
              <h3>Keep Emergency Contacts</h3>
              <p>Save local emergency numbers and keep your phone charged. Share live location with trusted contacts</p>
            </div>
            <div className="safety-card">
              <div className="feature-icon">👥</div>
              <h3>Trust Your Instincts</h3>
              <p>If something feels wrong, don't hesitate to leave. Your safety is more important than being polite</p>
            </div>
            <div className="safety-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payment Methods</h3>
              <p>Use secure payment methods and avoid carrying large amounts of cash. Keep copies of important documents</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>{t('ctaTitle')}</h2>
          <p>{t('ctaSubtitle')}</p>
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginTop: '1rem', marginBottom: '2rem' }}>
            {t('ctaIntentText')}
          </p>
          <div className="cta-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => handleRoleSelection('Guest')}>
                  {t('findHomeNewCity')}
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  {t('alreadyHaveAccount')}
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate(getDashboardRoute())}>
                {getDashboardText()}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Apps Coming Soon */}
      <section className="features">
        <div className="container">
          <h2>📱 Mobile Apps</h2>
          <div className="mobile-apps-grid">
            <div className="mobile-app-card">
              <h3>iOS App</h3>
              <p>App Store - Coming Soon!</p>
              <button className="btn btn-outline" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                App Store
              </button>
            </div>
            <div className="mobile-app-card">
              <h3>Android App</h3>
              <p>Google Play - Coming Soon!</p>
              <button className="btn btn-outline" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                Google Play
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Local Host Connect. Connecting travellers with local experiences.</p>
          <div className="footer-links" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Link to="/privacy-policy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms-of-service" style={{ color: 'white', textDecoration: 'none' }}>Terms of Service</Link>
            <Link to="/help" style={{ color: 'white', textDecoration: 'none' }}>Help & Support</Link>
          </div>
          
          {/* Social Media Links */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
            <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>Follow Us:</p>
            <a href="https://twitter.com/festiveguest" target="_blank" rel="noopener noreferrer" style={{ color: 'white', transition: 'opacity 0.3s' }} title="X (Twitter)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://instagram.com/_festiveguest" target="_blank" rel="noopener noreferrer" style={{ color: 'white', transition: 'opacity 0.3s' }} title="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://youtube.com/@festiveguest" target="_blank" rel="noopener noreferrer" style={{ color: 'white', transition: 'opacity 0.3s' }} title="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://facebook.com/festiveguest" target="_blank" rel="noopener noreferrer" style={{ color: 'white', transition: 'opacity 0.3s' }} title="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </div>
        </div>
      </footer>
      
      <DisclaimerModal 
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        selectedRole={selectedRole}
      />
    </div>
  );
};

export default LandingPage;
