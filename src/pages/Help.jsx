import React from 'react';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';

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
          <HelpCircle size={48} className="help-icon" />
          <h1>Help & Support</h1>
          <p>We're here to help you with any questions or issues you may have.</p>
        </div>

        <div className="help-content">
          <div className="help-card">
            <Mail size={32} className="card-icon" />
            <h3>Email Support</h3>
            <p>Send us an email and we'll get back to you as soon as possible.</p>
            <a href="mailto:support@festiveguest.com" className="btn btn-outline">
              support@festiveguest.com
            </a>
          </div>

          <div className="help-card">
            <MessageCircle size={32} className="card-icon" />
            <h3>WhatsApp Support</h3>
            <p>Chat with our support team directly for quick assistance.</p>
            <button 
              onClick={handleWhatsAppClick}
              className="btn btn-primary whatsapp-btn"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              Chat on WhatsApp
            </button>
          </div>
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-item">
            <h4>How do I become a host?</h4>
            <p>Go to the registration page, select "Become a Host", and fill out your profile details.</p>
          </div>
          <div className="faq-item">
            <h4>Is it free to use?</h4>
            <p>Registration is free for both guests and hosts. Specific festival experiences may have their own terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
