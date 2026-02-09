import React from 'react';

const SafetyGuidelines = () => {
  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>🛡️ Safety Guidelines</h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Please read these guidelines carefully before meeting hosts or guests
      </p>

      <div className="safety-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="safety-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
          <h3 style={{ marginBottom: '1rem' }}>Share Your Plans</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            Always inform family/friends about your travel plans, host details, and expected return time. Share your location and keep them updated.
          </p>
        </div>

        <div className="safety-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
          <h3 style={{ marginBottom: '1rem' }}>Meet in Public First</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            Arrange initial meetings in public places like cafes or restaurants before going to private locations. This helps build trust and ensures safety.
          </p>
        </div>

        <div className="safety-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
          <h3 style={{ marginBottom: '1rem' }}>Video Call Before Meeting</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            Have a video conversation to verify identity and get comfortable before meeting in person. This is an important step for both parties.
          </p>
        </div>

        <div className="safety-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📲</div>
          <h3 style={{ marginBottom: '1rem' }}>Keep Emergency Contacts</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            Save local emergency numbers and keep your phone charged. Share live location with trusted contacts during your stay.
          </p>
        </div>

        <div className="safety-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ marginBottom: '1rem' }}>Trust Your Instincts</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            If something feels wrong, don't hesitate to leave. Your safety is more important than being polite. Listen to your gut feeling.
          </p>
        </div>

        <div className="safety-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <div className="feature-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <h3 style={{ marginBottom: '1rem' }}>Secure Payment Methods</h3>
          <p style={{ color: '#64748b', lineHeight: '1.6' }}>
            Use secure payment methods and avoid carrying large amounts of cash. Keep copies of important documents in a safe place.
          </p>
        </div>
      </div>

      <div style={{ background: '#fef3c7', padding: '2rem', borderRadius: 'var(--radius)', border: '2px solid #f59e0b', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#92400e' }}>⚠️ Important Reminders</h2>
        <ul style={{ color: '#92400e', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
          <li>Never share sensitive personal information (bank details, passwords) with anyone</li>
          <li>Verify the identity of the person you're meeting through video calls</li>
          <li>Keep your family/friends informed about your whereabouts at all times</li>
          <li>Report any suspicious behavior or safety concerns immediately</li>
          <li>Use the in-app messaging system for all communications</li>
          <li>Read reviews and check profiles carefully before making arrangements</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Need Help?</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          If you experience any safety concerns or need assistance, please contact us immediately.
        </p>
        <a href="/help" className="btn btn-primary">Contact Support</a>
      </div>
    </div>
  );
};

export default SafetyGuidelines;
