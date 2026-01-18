import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, HelpCircle, Phone, Clock, Users, CheckCircle, AlertCircle, Send, Shield, Lock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Help = () => {
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setFeedback(prev => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || ''
      }));
    }
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.name || !feedback.email || !feedback.message) {
      setError('Please fill all fields');
      return;
    }
    
    setSending(true);
    setError('');
    try {
      const feedbackData = {
        name: feedback.name,
        email: feedback.email,
        message: feedback.message,
        userType: user?.userType || user?.role || 'Guest'
      };
      
      console.log('Sending feedback:', feedbackData);
      const response = await api.post('feedback', feedbackData);
      console.log('Feedback response:', response);
      setSent(true);
      setFeedback({ ...feedback, message: '' }); // Keep name/email for logged users
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error('Feedback error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = 'Failed to send feedback. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Feedback service not found. Please contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
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
            <a href="mailto:support@localhostconnect.com" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

        {/* Trust & Security Section */}
        <div style={{ marginTop: '3rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '2rem', borderRadius: 'var(--radius)', border: '2px solid #3b82f6' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: '#1e40af' }}>
              <Shield size={28} style={{ color: '#3b82f6' }} />
              Trust & Security
            </h2>
            <p style={{ color: '#475569', margin: '0' }}>Your safety and privacy are our top priorities</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Lock size={20} style={{ color: '#16a34a' }} />
                <h4 style={{ margin: 0, color: '#1e293b' }}>SSL Encryption</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>All data transmitted is encrypted with 256-bit SSL/TLS security</p>
            </div>
            
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={20} style={{ color: '#3b82f6' }} />
                <h4 style={{ margin: 0, color: '#1e293b' }}>Azure Hosting</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Hosted on Microsoft Azure with enterprise-grade security</p>
            </div>
            
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={20} style={{ color: '#16a34a' }} />
                <h4 style={{ margin: 0, color: '#1e293b' }}>Secure Payments</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>PCI-compliant payment processing through trusted providers</p>
            </div>
          </div>
        </div>

        {/* Important Policies Section */}
        <div style={{ marginTop: '3rem', background: '#fef3c7', padding: '2rem', borderRadius: 'var(--radius)', border: '2px solid #f59e0b' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: '#92400e' }}>
              <FileText size={28} style={{ color: '#f59e0b' }} />
              Important Policies & Guidelines
            </h2>
            <p style={{ color: '#78350f', margin: '0' }}>Please review our policies to understand your rights and responsibilities</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
            <Link to="/terms-of-service" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #fbbf24' }}>
                <FileText size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Terms of Service</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>User rights & responsibilities</p>
              </div>
            </Link>
            
            <Link to="/privacy-policy" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #fbbf24' }}>
                <Lock size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Privacy Policy</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>How we protect your data</p>
              </div>
            </Link>
            
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center', border: '1px solid #fbbf24' }}>
              <Shield size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Safety Guidelines</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Stay safe while connecting</p>
            </div>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
              <AlertCircle size={28} style={{ color: 'var(--warning)' }} />
              Troubleshooting Common Issues
            </h2>
            <p style={{ color: '#64748b', margin: '0' }}>Quick fixes for common technical problems</p>
          </div>
          
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                Can't log in or forgot password?
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#475569', lineHeight: '1.6' }}>Try these steps:</p>
              <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li>Clear your browser cache and cookies</li>
                <li>Try using incognito/private browsing mode</li>
                <li>Check if your email is correct (no extra spaces)</li>
                <li>Use the "Forgot Password" link to reset</li>
                <li>Contact support if issue persists</li>
              </ol>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                Website not loading or showing errors?
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#475569', lineHeight: '1.6' }}>Try these solutions:</p>
              <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li>Refresh the page (Ctrl+F5 or Cmd+Shift+R)</li>
                <li>Clear browser cache: Settings → Privacy → Clear browsing data</li>
                <li>Try a different browser (Chrome, Firefox, Edge)</li>
                <li>Check your internet connection</li>
                <li>Flush DNS: Open Command Prompt and type "ipconfig /flushdns"</li>
                <li>Disable browser extensions temporarily</li>
              </ol>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                Payment not processing?
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#475569', lineHeight: '1.6' }}>Common payment issues:</p>
              <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li>Verify card details are entered correctly</li>
                <li>Check if your card has sufficient balance</li>
                <li>Ensure international transactions are enabled</li>
                <li>Try a different payment method</li>
                <li>Contact your bank if payment is declined</li>
                <li>Wait 5 minutes and retry if gateway timeout occurs</li>
              </ol>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                Not receiving emails or notifications?
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#475569', lineHeight: '1.6' }}>Check these:</p>
              <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#475569', lineHeight: '1.8' }}>
                <li>Check your spam/junk folder</li>
                <li>Add support@localhostconnect.com to contacts</li>
                <li>Verify email address in your profile settings</li>
                <li>Check notification settings in your account</li>
                <li>Wait up to 10 minutes for email delivery</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Regional Support Section */}
        <div style={{ marginTop: '3rem', background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', padding: '2rem', borderRadius: 'var(--radius)', border: '2px solid #f97316' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: '#9a3412' }}>
              <Users size={28} style={{ color: '#f97316' }} />
              India-Focused Support
            </h2>
            <p style={{ color: '#78350f', margin: '0' }}>Tailored for Indian users with local language support and compliance</p>
          </div>
          
          <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#475569', lineHeight: '2' }}>
              <li><strong>Language Support:</strong> English and Hindi support available</li>
              <li><strong>Payment Methods:</strong> UPI, Net Banking, Cards, and Wallets accepted</li>
              <li><strong>Compliance:</strong> Adheres to Indian IT Act 2000, Consumer Protection Act 2019, and DPDP Act 2023</li>
              <li><strong>Local Time Support:</strong> Customer support available during IST business hours (9 AM - 6 PM)</li>
              <li><strong>GST Compliant:</strong> All transactions include applicable GST as per Indian tax laws</li>
              <li><strong>Consumer Rights:</strong> Full compliance with Indian consumer protection regulations</li>
            </ul>
          </div>
        </div>

        {/* Official Contact Warning */}
        <div style={{ marginTop: '3rem', background: '#fee2e2', padding: '1.5rem', borderRadius: 'var(--radius)', border: '2px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <AlertCircle size={32} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>⚠️ Beware of Impersonators</h3>
              <p style={{ margin: '0', color: '#7f1d1d', lineHeight: '1.6' }}>
                <strong>Official Contact Only:</strong> We will NEVER ask for your password, OTP, or banking details via email, WhatsApp, or phone. 
                Our only official support channels are <strong>support@localhostconnect.com</strong> and the WhatsApp number listed above. 
                Report any suspicious contact claiming to be FestiveGuest support immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Send Feedback Section */}
        <div className="feedback-section" style={{ marginTop: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
              <Send size={28} style={{ color: 'var(--primary)' }} />
              Send Feedback
            </h2>
            <p style={{ color: '#64748b', margin: '0' }}>Share your thoughts, suggestions, or report issues directly with us</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '500px', background: '#f8fafc', padding: '2rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              {error && (
                <div style={{ 
                  color: '#dc2626', 
                  background: '#fee2e2', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  border: '1px solid #fecaca'
                }}>
                  ⚠️ {error}
                </div>
              )}
              {sent ? (
                <div style={{ color: 'var(--success)', textAlign: 'center', padding: '1rem' }}>
                  <CheckCircle size={48} style={{ marginBottom: '1rem', color: '#16a34a' }} />
                  <h3 style={{ color: '#16a34a', margin: '0 0 0.5rem 0' }}>Feedback Sent Successfully!</h3>
                  <p style={{ margin: '0', color: '#64748b' }}>Thank you for your feedback. We'll review it and get back to you if needed.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={feedback.name}
                      onChange={(e) => setFeedback({...feedback, name: e.target.value})}
                      disabled={!!user}
                      style={{ 
                        padding: '0.75rem', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        fontSize: '1rem',
                        backgroundColor: user ? '#f3f4f6' : 'white',
                        cursor: user ? 'not-allowed' : 'text'
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={feedback.email}
                      onChange={(e) => setFeedback({...feedback, email: e.target.value})}
                      disabled={!!user}
                      style={{ 
                        padding: '0.75rem', 
                        border: '1px solid var(--border)', 
                        borderRadius: '0.5rem', 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        fontSize: '1rem',
                        backgroundColor: user ? '#f3f4f6' : 'white',
                        cursor: user ? 'not-allowed' : 'text'
                      }}
                    />
                    <textarea
                      placeholder="Your feedback, suggestions, or issues..."
                      value={feedback.message}
                      onChange={(e) => {
                        setFeedback({...feedback, message: e.target.value});
                        setError(''); // Clear error when user starts typing
                      }}
                      rows={5}
                      style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', resize: 'vertical', width: '100%', boxSizing: 'border-box', fontSize: '1rem' }}
                    />
                    <button 
                      type="submit" 
                      disabled={sending}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                    >
                      <Send size={16} />
                      {sending ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="faq-section" style={{ marginTop: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
              <HelpCircle size={28} style={{ color: 'var(--primary)' }} />
              Frequently Asked Questions
            </h2>
            <p style={{ color: '#64748b', margin: '0' }}>Find answers to common questions about Local Host Connect</p>
          </div>
          
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                How do I become a host?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Go to the registration page, select "Local Host", and fill out your profile details including your location, offerings, and bio. Once registered, you can start connecting with travelers looking for authentic local experiences.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                Is it free to use?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Registration is completely free for both travelers and hosts. You can browse profiles, chat with other users, and arrange local experiences at no cost. Individual arrangements between hosts and travelers may have their own terms.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                How do I find hosts or travelers?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>After logging in, go to your dashboard where you can browse profiles, filter by location, and view detailed information about other users. Use the chat feature to connect and arrange local experiences.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <MessageCircle size={20} style={{ color: 'var(--primary)' }} />
                How does the referral system work?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Share your referral code with friends. When they register using your code, both of you get special benefits. Invite 3 friends to unlock Premium features for 1 month including priority support and advanced filters!</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                What safety measures should I take?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Always meet in public places first, share your plans with trusted contacts, verify the other person's identity through video calls, keep emergency contacts handy, and trust your instincts. Never share personal financial information or make large advance payments.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                How do I report suspicious behavior?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>If you encounter any suspicious behavior, inappropriate messages, or safety concerns, immediately contact our support team via WhatsApp or email. We take all reports seriously and will investigate promptly to ensure community safety.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                What if I have a dispute with a host/traveler?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Contact our support team immediately with details of the issue. We'll mediate between both parties to find a fair resolution. Remember, all arrangements are between users - we facilitate introductions but cannot guarantee outcomes.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                How should I handle payments?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Use secure payment methods, avoid large advance payments, and consider paying after services are rendered when possible. Never share banking passwords or OTPs. For high-value arrangements, consider meeting in person first to build trust.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                Can I verify someone's identity?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Yes! We recommend video calls before meeting, checking their profile completeness, reading reviews from other users, and asking for references if needed. Trust your instincts - if something feels off, it's better to be cautious.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                What types of experiences can I find?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Our platform connects you for various travel needs: business travel accommodation, leisure tourism, festival celebrations, educational exchanges, family visits, cultural immersion, local food experiences, and city tours with insider knowledge.</p>
            </div>
            
            <div className="faq-item" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', color: 'var(--primary)' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                Is my information safe?
              </h4>
              <p style={{ margin: '0', color: '#475569', lineHeight: '1.6' }}>Yes, we take privacy seriously. Your personal information is protected and only shared with users you choose to connect with. We strongly recommend meeting in public places first, sharing your plans with trusted contacts, and taking all necessary safety precautions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
