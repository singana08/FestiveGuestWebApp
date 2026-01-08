import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ user }) => {
  const navigate = useNavigate();

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
          <h1 className="hero-title">Celebrate Festivals with Local Friends</h1>
          <p className="hero-subtitle">
            Experience authentic Pongal celebrations in East & West Godavari districts
          </p>
          <div className="hero-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/register?role=Guest')}>
                  Join as Guest
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/register?role=Host')}>
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
            <h3>🎉 Festival Season</h3>
            <p>Connect with locals during Pongal, Diwali, and other celebrations</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose Festive Guest?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>Local Accommodation</h3>
              <p>Stay with friendly hosts who provide comfortable accommodation during festival season</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Guided Tours</h3>
              <p>Explore nearby temples, cultural sites, and hidden gems with local guides</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Make New Friends</h3>
              <p>Connect with locals and fellow travelers, create lasting friendships</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎊</div>
              <h3>Authentic Experience</h3>
              <p>Participate in traditional celebrations, enjoy homemade festival food</p>
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
              <p>Browse profiles and connect with hosts/guests</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Celebrate</h3>
              <p>Enjoy authentic festival experiences together</p>
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
              <p>"Amazing Pongal experience in Rajahmundry! The host family treated me like their own."</p>
              <div className="testimonial-author">- Priya, Hyderabad</div>
            </div>
            <div className="testimonial">
              <p>"Met wonderful guests during Diwali. Sharing our traditions was so fulfilling."</p>
              <div className="testimonial-author">- Ravi, Kakinada</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Start Your Festival Journey?</h2>
          <p>Join thousands of travelers and hosts celebrating together</p>
          <div className="cta-buttons">
            {!user ? (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/register?role=Guest')}>
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
          <p>&copy; 2024 Festive Guest Marketplace. Connecting hearts during festivals.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
