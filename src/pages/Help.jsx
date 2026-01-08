import React from 'react';
import { Mail, MessageCircle, HelpCircle, Phone, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

const Help = () => {
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
