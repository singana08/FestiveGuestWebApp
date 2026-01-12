import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import chatService from '../utils/chatService';
import api from '../utils/api';
import ImageWithSas from '../components/ImageWithSas';

const ChatWidget = ({ recipientId, recipientName, recipientImageUrl, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}').userId;
  const messagesEndRef = useRef(null);
  const messageHandlerRef = useRef(null);

  useEffect(() => {
    console.log('ChatWidget mounted with:', { recipientId, recipientName });
    initChat();
    return () => {
      console.log('ChatWidget unmounting');
      if (messageHandlerRef.current) {
        chatService.offReceiveMessage(messageHandlerRef.current);
      }
    };
  }, [recipientId]);

  const initChat = async () => {
    try {
      console.log('Initializing chat...');
      setLoading(true);
      setError(null);
      
      // Set a timeout to show as connected even if SignalR fails
      const fallbackTimer = setTimeout(() => {
        if (!connected) {
          console.log('Using fallback connection state');
          setConnected(true);
        }
      }, 2000);
      
      try {
        await chatService.connect();
        await chatService.joinChat(recipientId);
        clearTimeout(fallbackTimer);
        console.log('Chat service connected successfully');
      } catch (connectionError) {
        console.warn('Chat service connection failed, using fallback:', connectionError);
        clearTimeout(fallbackTimer);
      }
      
      messageHandlerRef.current = (data) => {
        console.log('Received message:', data);
        if (data.senderId === recipientId) {
          setMessages(prev => {
            if (prev.find(m => m.id === data.id)) return prev;
            return [...prev, {
              id: data.id,
              sender: 'Recipient',
              text: data.message,
              timestamp: new Date(data.timestamp),
              status: 'delivered'
            }];
          });
        }
      };
      
      chatService.onReceiveMessage(messageHandlerRef.current);
      
      // Load message history
      try {
        const historyRes = await api.get(`chat/messages/${recipientId}`);
        if (historyRes.data && historyRes.data.length > 0) {
          const formattedHistory = historyRes.data.map(msg => ({
            id: msg.id,
            sender: msg.senderId === userId ? 'Me' : 'Recipient',
            text: msg.message,
            timestamp: new Date(msg.timestamp),
            status: msg.status?.toLowerCase() || 'sent'
          }));
          setMessages(formattedHistory);
          console.log('Loaded message history:', formattedHistory.length, 'messages');
        }
      } catch (historyError) {
        console.error('Failed to load message history:', historyError);
        setError('Failed to load message history');
      }
      
      setConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to connect to chat service');
      // Still show as connected for basic functionality
      setConnected(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      const messageText = newMessage.trim();
      setNewMessage('');
      
      console.log('Sending message:', messageText, 'to:', recipientId);
      
      // Add message to UI immediately for better UX
      const tempMessage = {
        id: Date.now(),
        sender: 'Me',
        text: messageText,
        timestamp: new Date(),
        status: 'sending'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      try {
        await chatService.sendMessage(recipientId, messageText);
        console.log('Message sent successfully via SignalR');
        
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        ));
      } catch (sendError) {
        console.error('Failed to send message via chat service:', sendError);
        
        // Try sending via API as fallback
        try {
          console.log('Attempting API fallback for message send');
          await api.post('chat/send', {
            recipientId,
            message: messageText
          });
          console.log('Message sent via API fallback');
          
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, status: 'sent' }
              : msg
          ));
        } catch (apiError) {
          console.error('Failed to send message via API:', apiError);
          
          // Mark message as failed
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, status: 'failed' }
              : msg
          ));
          
          // Restore message text for retry
          setNewMessage(messageText);
        }
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-user-info">
          <ImageWithSas 
            src={recipientImageUrl}
            alt={recipientName}
            className="user-avatar"
            fallbackText="User"
          />
          <div>
            <div className="user-name">{recipientName || 'Chat'}</div>
            <div className="user-status">
              ● {connected ? 'Online' : (loading ? 'Connecting...' : 'Offline')}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="close-btn" title="Close chat">
          <X size={16} />
        </button>
      </div>
      
      <div className="chat-messages">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ marginBottom: '0.5rem' }}>💬</div>
            Loading messages...
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            <div style={{ marginBottom: '0.5rem' }}>⚠️</div>
            {error}
            <button 
              onClick={initChat}
              style={{
                display: 'block',
                margin: '1rem auto 0',
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ marginBottom: '0.5rem' }}>👋</div>
            Start a conversation with {recipientName}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m.id || i} className={`message ${m.sender === 'Me' ? 'sent' : 'received'}`}>
              <div className="message-content">{m.text}</div>
              <div style={{ 
                fontSize: '11px', 
                color: '#65676b', 
                marginTop: '2px', 
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {m.sender === 'Me' && (
                  <span className={`message-status ${m.status}`}>
                    {m.status === 'sending' && '⏳'}
                    {m.status === 'sent' && '✓'}
                    {m.status === 'delivered' && '✓✓'}
                    {m.status === 'failed' && '❌'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message..."
          className="message-input"
          disabled={sending || loading}
        />
        <button 
          type="submit" 
          className="send-btn" 
          disabled={sending || !newMessage.trim() || loading}
          title="Send message"
        >
          {sending ? (
            <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;