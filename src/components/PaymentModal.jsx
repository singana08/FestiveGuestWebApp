import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const PaymentModal = ({ amount, purpose, onComplete, onCancel }) => {
  const { t } = useLanguage();
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  // UPI payment details
  const upiId = 'your-upi-id@paytm'; // Replace with actual UPI ID
  let upiUrl;
  try {
    upiUrl = `upi://pay?pa=${upiId}&pn=FestiveGuest&am=${amount}&cu=INR&tn=${encodeURIComponent(purpose)}`;
  } catch (error) {
    console.error('Error creating UPI URL:', error);
    upiUrl = `upi://pay?pa=${upiId}&pn=FestiveGuest&am=${amount}&cu=INR`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      alert(t('enterTransactionIdPlaceholder'));
      return;
    }

    setLoading(true);
    try {
      await onComplete(transactionId);
    } catch (error) {
      alert(t('paymentNote'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpiClick = () => {
    window.open(upiUrl, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: '400px', margin: '20px', background: 'white' }}>
        <h3>{t('paymentRequired')}</h3>
        <p><strong>{t('purpose')}:</strong> {purpose}</p>
        <p><strong>{t('amount')}:</strong> ₹{amount}</p>

        <div className="qr-payment">
          <h4>{t('payViaUpi')}</h4>
          
          <div className="qr-code">
            <div style={{ textAlign: 'center' }}>
              <p>{t('qrCode')}</p>
              <p style={{ fontSize: '12px' }}>{t('scanUpi')}</p>
            </div>
          </div>

          <p><strong>{t('upiId')}:</strong> {upiId}</p>
          
          <button 
            className="btn btn-primary" 
            onClick={handleUpiClick}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {t('payWithUpiApp')}
          </button>

          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', background: '#f9f9f9', color: '#333' }}>
            <h4>{t('manualPaymentInstructions')}</h4>
            <ol style={{ textAlign: 'left', fontSize: '14px', margin: '10px 0', paddingLeft: '20px' }}>
              <li>{t('openUpiApp')}</li>
              <li>{t('sendAmount', { amount })}</li>
              <li>{t('addNote', { purpose })}</li>
              <li>{t('completePayment')}</li>
              <li>{t('enterTransactionId')}</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>{t('upiTransactionId')}</label>
            <input
              type="text"
              className="form-control"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder={t('enterTransactionIdPlaceholder')}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('verifying') : t('verifyPayment')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              {t('cancel')}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <p>{t('paymentNote')}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
