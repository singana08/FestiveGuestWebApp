import React, { useState } from 'react';

const PaymentModal = ({ amount, purpose, onComplete, onCancel }) => {
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
      alert('Please enter transaction ID');
      return;
    }

    setLoading(true);
    try {
      await onComplete(transactionId);
    } catch (error) {
      alert('Payment verification failed. Please try again.');
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
        <h3>Payment Required</h3>
        <p><strong>Purpose:</strong> {purpose}</p>
        <p><strong>Amount:</strong> ₹{amount}</p>

        <div className="qr-payment">
          <h4>Pay via UPI</h4>
          
          <div className="qr-code">
            <div style={{ textAlign: 'center' }}>
              <p>QR Code</p>
              <p style={{ fontSize: '12px' }}>Scan with any UPI app</p>
            </div>
          </div>

          <p><strong>UPI ID:</strong> {upiId}</p>
          
          <button 
            className="btn btn-primary" 
            onClick={handleUpiClick}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            Pay with UPI App
          </button>

          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', background: '#f9f9f9', color: '#333' }}>
            <h4>Manual Payment Instructions:</h4>
            <ol style={{ textAlign: 'left', fontSize: '14px', margin: '10px 0', paddingLeft: '20px' }}>
              <li>Open any UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
              <li>Send ₹{amount} to UPI ID: <strong>{upiId}</strong></li>
              <li>Add note: "{purpose}"</li>
              <li>Complete the payment</li>
              <li>Enter the transaction ID below</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>UPI Transaction ID</label>
            <input
              type="text"
              className="form-control"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter 12-digit transaction ID"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Payment'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>

        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <p>Note: Payment verification may take a few minutes. You'll be notified once approved by admin.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
