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
    const role = user?.role || user?.userType || user?.partitionKey;
    if (role === 'Host') return '/host-dashboard';
    if (role === 'Guest') return '/guest-dashboard';
    if (role === 'Admin') return '/admin';
    return '/';
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
                  I Want to Be a Guest
                </button>
                <button className="btn btn-secondary" onClick={() => handleRoleSelection('Host')}>
                  I Want to Host Guests
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate(getDashboardRoute())}>
                Go to My Dashboard
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
                  I Want to Be a Guest
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  Already have an account?
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate(getDashboardRoute())}>
                Go to My Dashboard
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
              <div className="feature-icon">📱</div>
              <h3>iOS App</h3>
              <p>App Store - Coming Soon!</p>
              <button className="btn btn-outline" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                🍎 App Store
              </button>
            </div>
            <div className="mobile-app-card">
              <div className="feature-icon">🤖</div>
              <h3>Android App</h3>
              <p>Google Play - Coming Soon!</p>
              <button className="btn btn-outline" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                📱 Google Play
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
