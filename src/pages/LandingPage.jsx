import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DisclaimerModal from '../components/DisclaimerModal';

const LandingPage = ({ user }) => {
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

  const getDashboardRoute = () => {
    return '/posts';
  };

  const getDashboardText = () => {
    return 'Go to Posts';
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Connect with Local Hosts Anywhere</h1>
          <p className="hero-subtitle">
            Experience authentic local culture and hospitality during your travels
          </p>
          <div className="hero-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => handleRoleSelection('Guest')}>
                  Join as a Guest
                </button>
                <button className="btn btn-secondary" onClick={() => handleRoleSelection('Host')}>
                  Join as a Host
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
            <h3>🌍 Travel & Connect</h3>
            <p>Stay with locals, experience culture, make lasting memories</p>
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
          <h2>Why Choose Local Host Connect?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>Local Accommodation</h3>
              <p>Stay with friendly hosts who provide comfortable accommodation and local insights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Local Experiences</h3>
              <p>Discover hidden gems, local attractions, and authentic experiences with insider knowledge</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Cultural Exchange</h3>
              <p>Connect with locals and fellow travellers, learn about local customs and traditions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>Authentic Cuisine</h3>
              <p>Enjoy homemade local food and discover regional specialties you won't find in restaurants</p>
            </div>
          </div>
        </div>
      </section>

      {/* Travel Types Section */}
      <section className="testimonials">
        <div className="container">
          <h2>Perfect for Every Type of Travel</h2>
          <div className="travel-types-grid">
            <div className="travel-card">
              <div className="feature-icon">💼</div>
              <h3>Business & Work</h3>
              <p>Comfortable stays for work trips with local networking opportunities</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🎒</div>
              <h3>Adventure & Leisure</h3>
              <p>Explore new destinations with insider tips from local hosts</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🎉</div>
              <h3>Festivals & Events</h3>
              <p>Experience authentic celebrations during Diwali, Pongal, and local festivals</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🎓</div>
              <h3>Education & Research</h3>
              <p>Perfect for students, researchers, and cultural learning experiences</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">👨‍👩‍👧‍👦</div>
              <h3>Family Visits</h3>
              <p>Extended family stays and reunions in different cities</p>
            </div>
            <div className="travel-card">
              <div className="feature-icon">🌍</div>
              <h3>Cultural Exchange</h3>
              <p>Immerse yourself in local traditions and make lasting connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Register</h3>
              <p>Sign up as a Guest or Host for free</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Connect</h3>
              <p>Browse profiles and connect with hosts/guests in your destination</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Experience</h3>
              <p>Enjoy authentic local experiences and create lasting memories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2>What Our Users Say</h2>
          <div className="testimonials-compact-grid">
            <div className="testimonial-compact">
              <p>"Amazing experience staying with a local family in Rajahmundry! They showed me places I never would have found on my own."</p>
              <div className="testimonial-author">- Priya, Hyderabad</div>
            </div>
            <div className="testimonial-compact">
              <p>"Hosting travellers has been so rewarding. I've made friends from all over India and learned so much about different cultures."</p>
              <div className="testimonial-author">- Ravi, Kakinada</div>
            </div>
            <div className="testimonial-compact">
              <p>"Perfect for my business trips to Chennai. My host helped me navigate the city and even introduced me to local business contacts."</p>
              <div className="testimonial-author">- Amit, Mumbai</div>
            </div>
            <div className="testimonial-compact">
              <p>"As a student researching folk traditions, staying with local families gave me insights no textbook could provide."</p>
              <div className="testimonial-author">- Meera, Delhi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Trust Section */}
      <section className="features">
        <div className="container">
          <h2>Your Safety & Trust is Our Priority</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Profile Registration</h3>
              <p>All users create detailed profiles with personal information for transparency and trust</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Review System</h3>
              <p>Read genuine reviews from previous guests and hosts to make informed decisions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Secure Messaging</h3>
              <p>Connect with hosts and guests through our secure in-app messaging system</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🆘</div>
              <h3>24/7 Support</h3>
              <p>Our support team is available round the clock to help with any issues or concerns</p>
            </div>
          </div>
        </div>
      </section>



      {/* Host Benefits */}
      <section className="how-it-works">
        <div className="container">
          <h2>Benefits of Becoming a Host</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">💰</div>
              <h3>Earn Extra Income</h3>
              <p>Generate additional revenue by hosting travelers in your spare room</p>
            </div>
            <div className="step">
              <div className="step-number">🌍</div>
              <h3>Meet New People</h3>
              <p>Connect with travellers from different cultures and backgrounds</p>
            </div>
            <div className="step">
              <div className="step-number">🏠</div>
              <h3>Share Your Culture</h3>
              <p>Showcase your local traditions, food, and hidden gems to visitors</p>
            </div>
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
          <h2>Ready to Start Your Travel Journey?</h2>
          <p>Join thousands of travellers and hosts connecting across India</p>
          <div className="cta-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => handleRoleSelection('Guest')}>
                  Join as a Guest
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  Already have an account?
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
            <a href="https://instagram.com/festiveguest" target="_blank" rel="noopener noreferrer" style={{ color: 'white', transition: 'opacity 0.3s' }} title="Instagram">
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
