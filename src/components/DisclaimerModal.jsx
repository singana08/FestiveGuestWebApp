import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const DisclaimerModal = ({ isOpen, onClose, selectedRole }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [agreementTimestamp, setAgreementTimestamp] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = 'hidden';
      
      // Prevent scroll on touch devices
      const preventScroll = (e) => {
        if (!e.target.closest('.modal-content')) {
          e.preventDefault();
        }
      };
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.documentElement.style.overflow = '';
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('wheel', preventScroll);
      };
    }
  }, [isOpen]);

  const handleAccept = () => {
    if (!disclaimerAccepted) return;
    
    const timestamp = Date.now();
    const acceptanceData = {
      accepted: true,
      timestamp,
      role: selectedRole,
      userAgent: navigator.userAgent,
      sessionId: crypto.randomUUID()
    };
    
    // Store in sessionStorage with security measures
    sessionStorage.setItem('disclaimerAcceptance', JSON.stringify(acceptanceData));
    
    navigate(`/register?role=${selectedRole}&disclaimerAccepted=${timestamp}`);
    onClose();
  };

  const handleCancel = () => {
    navigate('/');
    onClose();
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setDisclaimerAccepted(isChecked);
    if (isChecked) {
      setAgreementTimestamp(Date.now());
    } else {
      setAgreementTimestamp(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overscrollBehavior: 'contain' }}>
        <div className="modal-header" style={{ padding: '1.5rem', flexShrink: 0 }}>
          <h3 style={{ color: '#1e293b', margin: 0 }}>{t('importantDisclaimer')}</h3>
        </div>
        
        <div className="modal-body" style={{ padding: '0 1.5rem', overflowY: 'auto', flex: 1 }}>
          <style>
            {`
              .modal-body::-webkit-scrollbar {
                width: 4px;
              }
              .modal-body::-webkit-scrollbar-track {
                background: transparent;
              }
              .modal-body::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 2px;
              }
              .modal-body::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>
          <div style={{ 
            padding: '1.5rem', 
            background: '#fef3c7', 
            border: '2px solid #f59e0b', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ color: '#92400e', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 1rem 0', fontWeight: '600' }}>
                <strong>Local Host Connect</strong> {t('disclaimerIntro')}
              </p>
              <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.75rem' }}>{t('notResponsible')}</li>
                <li style={{ marginBottom: '0.75rem' }}>{t('noGuarantee')}</li>
                <li style={{ marginBottom: '0.75rem' }}>{t('platformOnly')}</li>
                <li style={{ marginBottom: '0.75rem' }}>{t('ownRisk')}</li>
                <li style={{ marginBottom: '0.75rem' }}>{t('paymentCaution')}</li>
                <li style={{ marginBottom: '0.75rem' }}>{t('meetPublic')}</li>
                <li>{t('fullResponsibility')}</li>
              </ul>
            </div>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: '#f0f9ff', 
            border: '2px solid #0ea5e9', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '1rem',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={handleCheckboxChange}
                required
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#0ea5e9'
                }}
              />
              <span style={{ color: '#0c4a6e', fontWeight: '500' }}>
                {t('iAgree')}{' '}
                <button 
                  type="button"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#0ea5e9', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                  onClick={() => window.open('/privacy-policy', '_blank')}
                >
                  {t('privacyPolicy')}
                </button>
                {' '}{t('and')}{' '}
                <button 
                  type="button"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#0ea5e9', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                  onClick={() => window.open('/terms-of-service', '_blank')}
                >
                  {t('termsOfService')}
                </button>.
              </span>
            </label>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '1.5rem', marginBottom: '1rem', flexShrink: 0 }}>
          <button 
            onClick={handleCancel}
            className="btn btn-outline"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {t('cancel')}
          </button>
          <button 
            onClick={handleAccept}
            className="btn btn-primary"
            disabled={!disclaimerAccepted}
            style={{ 
              padding: '0.75rem 1.5rem',
              opacity: !disclaimerAccepted ? 0.5 : 1,
              cursor: !disclaimerAccepted ? 'not-allowed' : 'pointer'
            }}
          >
            {t('agreeContinue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;