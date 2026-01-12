import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import chatService from '../utils/chatService';
import ImageWithSas from '../components/ImageWithSas';

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Get userId consistently
  const getUserId = () => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) return storedUserId;
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.userId || user.id;
    } catch {
      return null;
    }
  };
  
  const userId = getUserId();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    
    // Temporarily disable SignalR due to CORS issues
    // TODO: Re-enable when backend CORS is fixed
    /*
    const setupSignalR = async () => {
      try {
        await chatService.connect();
        chatService.onReceiveMessage((data) => {
          console.log('Received message in Chats page:', data);
          fetchConversations();
        });
      } catch (error) {
        console.error('Failed to setup SignalR in Chats:', error);
      }
    };
    
    setupSignalR();
    */
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleProfileClick = async (userId) => {
    try {
      const profileRes = await api.post('user/public-profile', {
        userId: userId
      });
      setSelectedProfile(profileRes.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('chat/conversations');
      
      const validConversations = (response.data || []).map(conv => ({
        ...conv,
        otherUserName: conv.otherUserName || 'Unknown User',
        lastMessage: conv.lastMessage || '',
        timestamp: conv.timestamp || new Date().toISOString(),
        unreadCount: conv.unreadCount || 0
      }));
      
      setConversations(validConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = async (conversation) => {
    setSelectedChat(conversation);
    setMessages([]);
    
    if (!conversation.otherUserId) {
      console.error('No otherUserId in conversation:', conversation);
      return;
    }
    
    await loadMessages(conversation.otherUserId);
    setShowChatView(true);
  };

  const loadMessages = async (recipientId) => {
    try {
      const response = await api.get(`chat/messages/${recipientId}`);
      
      if (!response.data || !Array.isArray(response.data)) {
        setMessages([]);
        return;
      }
      
      const formattedMessages = response.data.map(msg => ({
        id: msg.id,
        sender: msg.senderId === userId ? 'Me' : 'Recipient',
        text: msg.message || '',
        timestamp: new Date(msg.timestamp),
        status: msg.status || 'sent'
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedChat(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      setSending(true);
      const content = newMessage;
      setNewMessage('');
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'Me',
        text: content,
        timestamp: new Date(),
        status: 'Sent'
      }]);
      
      // Use API instead of SignalR
      const response = await api.post('chat/send', {
        recipientId: selectedChat.otherUserId,
        message: content
      });
      
      // Refresh conversations to update last message
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chats-container">
      {/* Conversations Sidebar */}
      <div className={`conversations-sidebar ${showChatView ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <h3>💬 Messages</h3>
        </div>
        
        <div className="conversations-list">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.chatRoom} 
                className={`conversation-item ${selectedChat?.otherUserId === conv.otherUserId ? 'active' : ''}`}
                onClick={() => handleConversationClick(conv)}
              >
                <div className="conversation-avatar">
                  <ImageWithSas 
                    src={conv.profileImageUrl}
                    alt={conv.otherUserName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    fallbackText="User"
                  />
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <div className="conversation-name">{conv.otherUserName || 'Unknown User'}</div>
                    <div className="conversation-time">{formatTime(conv.timestamp)}</div>
                  </div>
                  <div className="conversation-preview">
                    {conv.lastSenderId === userId ? 'You: ' : ''}{conv.lastMessage || 'Start chatting'}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div style={{
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    background: '#6366f1',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 6px'
                  }}>
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`chat-window ${showChatView ? 'mobile-visible' : ''}`}>
        {selectedChat ? (
          <>
            <div className="chat-header">
              <button className="mobile-back-btn" onClick={handleBackToList}>
                <ArrowLeft size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleProfileClick(selectedChat.otherUserId)}>
                  <ImageWithSas 
                    src={selectedChat.profileImageUrl}
                    alt={selectedChat.otherUserName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallbackText="User"
                  />
                </div>
                <h4 style={{ margin: 0, cursor: 'pointer' }} onClick={() => handleProfileClick(selectedChat.otherUserId)}>{selectedChat.otherUserName}</h4>
              </div>
            </div>
            
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`message ${msg.sender === 'Me' ? 'sent' : 'received'}`}>
                  <div className="message-content">{msg.text}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'Me' && msg.status && (
                      <span style={{ marginLeft: '4px', fontSize: '10px' }}>• {msg.status}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-btn" disabled={sending}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start chatting</p>
          </div>
        )}
      </div>
      
      {/* Profile Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{selectedProfile.name}</h3>
              <button onClick={() => setSelectedProfile(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <ImageWithSas 
                  src={selectedProfile.profileImageUrl}
                  alt={selectedProfile.name}
                  className="modal-profile-image"
                  fallbackText="Profile"
                  style={{ flexShrink: 0, width: '100px', height: '100px' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{selectedProfile.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>📍 {selectedProfile.location}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0' }}>
                    {selectedProfile.userType} • Joined {new Date(selectedProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--text)' }}>
                  {selectedProfile.userType === 'Host' ? '🏠 About My Hosting' : '✨ About Me'}
                </h4>
                <p style={{ 
                  color: '#475569', 
                  lineHeight: '1.5',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  margin: '0'
                }}>
                  {selectedProfile.bio || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats;