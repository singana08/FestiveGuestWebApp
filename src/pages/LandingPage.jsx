import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DisclaimerModal from '../components/DisclaimerModal';

const LandingPage = ({ user }) => {
  const navigate = useNavigate();
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

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
                  Find Local Hosts
                </button>
                <button className="btn btn-secondary" onClick={() => handleRoleSelection('Host')}>
                  Become a Host
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
              <p>Connect with locals and fellow travelers, learn about local customs and traditions</p>
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
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Business Travel</h3>
              <p>Comfortable stays for work trips with local networking opportunities</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎒</div>
              <h3>Leisure Travel</h3>
              <p>Explore new destinations with insider tips from local hosts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎉</div>
              <h3>Festival Travel</h3>
              <p>Experience authentic celebrations during Diwali, Pongal, and local festivals</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Educational Travel</h3>
              <p>Perfect for students, researchers, and cultural learning experiences</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧‍👦</div>
              <h3>Family Visits</h3>
              <p>Extended family stays and reunions in different cities</p>
            </div>
            <div className="feature-card">
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
          <div className="testimonials-grid">
            <div className="testimonial">
              <p>"Amazing experience staying with a local family in Rajahmundry! They showed me places I never would have found on my own."</p>
              <div className="testimonial-author">- Priya, Hyderabad</div>
            </div>
            <div className="testimonial">
              <p>"Hosting travelers has been so rewarding. I've made friends from all over India and learned so much about different cultures."</p>
              <div className="testimonial-author">- Ravi, Kakinada</div>
            </div>
            <div className="testimonial">
              <p>"Perfect for my business trips to Chennai. My host helped me navigate the city and even introduced me to local business contacts."</p>
              <div className="testimonial-author">- Amit, Mumbai</div>
            </div>
            <div className="testimonial">
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

      {/* Popular Destinations */}
      <section className="testimonials">
        <div className="container">
          <h2>Popular Destinations</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏛️</div>
              <h3>Hyderabad</h3>
              <p>Tech hub with rich history, famous for biryani and Charminar</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏖️</div>
              <h3>Visakhapatnam</h3>
              <p>Beautiful coastal city with beaches, hills, and naval heritage</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌾</div>
              <h3>Rajahmundry</h3>
              <p>Cultural capital on Godavari river, known for arts and literature</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏭</div>
              <h3>Kakinada</h3>
              <p>Port city with industrial significance and beautiful coastline</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎭</div>
              <h3>Vijayawada</h3>
              <p>Commercial hub with temples, caves, and rich cultural heritage</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏺</div>
              <h3>Tirupati</h3>
              <p>Sacred pilgrimage destination with ancient temples and traditions</p>
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
              <p>Connect with travelers from different cultures and backgrounds</p>
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
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Share Your Plans</h3>
              <p>Always inform family/friends about your travel plans, host details, and expected return time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Meet in Public First</h3>
              <p>Arrange initial meetings in public places like cafes or restaurants before going to private locations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📞</div>
              <h3>Video Call Before Meeting</h3>
              <p>Have a video conversation to verify identity and get comfortable before meeting in person</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📲</div>
              <h3>Keep Emergency Contacts</h3>
              <p>Save local emergency numbers and keep your phone charged. Share live location with trusted contacts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Trust Your Instincts</h3>
              <p>If something feels wrong, don't hesitate to leave. Your safety is more important than being polite</p>
            </div>
            <div className="feature-card">
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
          <p>Join thousands of travelers and hosts connecting across India</p>
          <div className="cta-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => handleRoleSelection('Guest')}>
                  Get Started
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

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Local Host Connect. Connecting travelers with local experiences.</p>
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
