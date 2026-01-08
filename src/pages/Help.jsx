import React, { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, Phone, Clock, Users, CheckCircle, AlertCircle, Send } from 'lucide-react';
import api from '../utils/api';

const Help = () => {
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message) {
      alert('Please fill all fields');
      return;
    }
    
    setSending(true);
    try {
      await api.post('feedback', feedback);
      setSent(true);
      setFeedback({ name: '', email: '', message: '' });
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Failed to send feedback:', error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };
  const handleWhatsAppClick = () => {
    // Obfuscate the number in code so it's not a single string
    const countryCode = "91";
    const part1 = "9966";
    const part2 = "888";
    const part3 = "484";
    const fullLink = `https://wa.me/${countryCode}${part1}${part2}${part3}`;
    window.open(fullLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="help-page">
      <div className="help-container">
        <div className="help-header">
          <HelpCircle size={48} className="help-icon" style={{ color: 'var(--primary)' }} />
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Users size={32} style={{ color: 'var(--primary)' }} />
            Help & Support
          </h1>
          <p>We're here to help you with any questions or issues you may have.</p>
        </div>

        <div className="help-content">
          <div className="help-card">
            <Mail size={32} className="card-icon" style={{ color: 'var(--primary)' }} />
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} />
              Email Support
            </h3>
            <p>Send us an email and we'll get back to you as soon as possible.</p>
            <a href="mailto:support@festiveguest.com" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} />
              Customer Support
            </a>
          </div>

          <div className="help-card">
            <MessageCircle size={32} className="card-icon" style={{ color: '#25D366' }} />
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={20} />
              WhatsApp Support
            </h3>
            <p>Chat with our support team directly for quick assistance.</p>
            <button 
              onClick={handleWhatsAppClick}
              className="btn btn-primary whatsapp-btn"
              style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </button>
          </div>
        </div>

        <div className="feedback-section" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#f8fafc', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', transition: 'all 0.3s ease', textAlign: 'center' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-5px)'; e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = 'var(--shadow)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'var(--shadow)'; }}>
            <Send size={32} className="card-icon" style={{ color: 'var(--primary)', margin: '0 auto' }} />
            <h3 style={{ textAlign: 'center' }}>Send Feedback</h3>
            <p style={{ textAlign: 'center' }}>Share your thoughts or report issues directly with us.</p>
            {sent ? (
              <div style={{ color: 'var(--success)', textAlign: 'center', padding: '1rem' }}>
                <CheckCircle size={24} style={{ marginBottom: '0.5rem' }} />
                <p>Feedback sent successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={feedback.name}
                  onChange={(e) => setFeedback({...feedback, name: e.target.value})}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', width: '100%', boxSizing: 'border-box' }}
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={feedback.email}
                  onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', width: '100%', boxSizing: 'border-box' }}
                />
                <textarea
                  placeholder="Your feedback or message..."
                  value={feedback.message}
                  onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                  rows={4}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                />
                <button 
                  type="submit" 
                  disabled={sending}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                >
                  <Send size={16} />
                  {sending ? 'Sending...' : 'Send Feedback'}
                </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="faq-section">
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <HelpCircle size={28} style={{ color: 'var(--primary)' }} />
            Frequently Asked Questions
          </h2>
          <div className="faq-item">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              How do I become a host?
            </h4>
            <p>Go to the registration page, select "Become a Host", and fill out your profile details.</p>
          </div>
          <div className="faq-item">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
              Is it free to use?
            </h4>
            <p>Registration is free for both guests and hosts. Specific festival experiences may have their own terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
