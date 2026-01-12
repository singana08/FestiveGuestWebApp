import React, { useState } from 'react';
import ChatWidget from './ChatWidget';

const ChatDebug = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [testRecipientId, setTestRecipientId] = useState('');
  const [testRecipientName, setTestRecipientName] = useState('');

  const openTestChat = () => {
    if (!testRecipientId.trim() || !testRecipientName.trim()) {
      alert('Please enter both recipient ID and name');
      return;
    }

    console.log('Opening test chat with:', { id: testRecipientId, name: testRecipientName });
    setActiveChat({
      id: testRecipientId.trim(),
      name: testRecipientName.trim(),
      imageUrl: null
    });
  };

  const closeChat = () => {
    console.log('Closing test chat');
    setActiveChat(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Chat Debug Tool</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Recipient ID:
          <input
            type="text"
            value={testRecipientId}
            onChange={(e) => setTestRecipientId(e.target.value)}
            placeholder="Enter recipient user ID"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '0.25rem',
              marginTop: '0.25rem'
            }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Recipient Name:
          <input
            type="text"
            value={testRecipientName}
            onChange={(e) => setTestRecipientName(e.target.value)}
            placeholder="Enter recipient name"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '0.25rem',
              marginTop: '0.25rem'
            }}
          />
        </label>
      </div>
      <button
        onClick={openTestChat}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          marginRight: '1rem'
        }}
      >
        Open Test Chat
      </button>
      <button
        onClick={closeChat}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer'
        }}
      >
        Close Chat
      </button>

      {activeChat && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          width: '350px',
          height: '500px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
          animation: 'slideInUp 0.3s ease-out'
        }}>
          <ChatWidget
            recipientId={activeChat.id}
            recipientName={activeChat.name}
            recipientImageUrl={activeChat.imageUrl}
            onClose={closeChat}
          />
        </div>
      )}
    </div>
  );
};

export default ChatDebug;