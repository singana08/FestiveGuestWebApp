import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { Send, ArrowLeft } from 'lucide-react';

import api from '../utils/api';

function Chat() {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const initialized = useRef(false);
  const chatClientRef = useRef(null);
  const tidRef = useRef(null);
  const userAcsIdRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      setTimeout(() => {
        setToast(prev => prev ? { ...prev, hiding: true } : null);
        setTimeout(() => setToast(null), 300);
      }, 3000);
    }
  };

  const messageHandler = (e) => {
    console.log('Real-time message event received:', e);
    // Use refs for threadId and current ACS user ID to ensure we filter correctly
    if (e.threadId === tidRef.current && e.sender.communicationUserId !== userAcsIdRef.current) {
      setMessages(prev => {
        // Prevent duplicates by checking ID
        if (prev.find(m => m.id === e.id)) return prev;
        return [...prev, {
          id: e.id,
          sender: 'Recipient',
          text: e.message,
          timestamp: new Date()
        }];
      });
    }
  };

  useEffect(() => {
    if (userId && recipientId && !initialized.current) {
      initialized.current = true;
      initChat();
    }

    return () => {
      if (chatClientRef.current) {
        console.log('Cleaning up chat real-time notifications...');
        chatClientRef.current.off('chatMessageReceived', messageHandler);
        chatClientRef.current.stopRealtimeNotifications().catch(console.error);
        chatClientRef.current = null;
      }
    };
  }, [userId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initChat = async () => {
    try {
      setLoading(true);
      console.log('Initializing chat for user:', userId, 'with recipient:', recipientId);

      // 1. Get Token and Identity
      console.log('Fetching chat token...');
      const tokenRes = await api.get('issuechattoken', { params: { userId } });
      const { token, user } = tokenRes.data;
      setToken(token);
      userAcsIdRef.current = user.communicationUserId;
      console.log('Token received for ACS ID:', user.communicationUserId);

      const credential = new AzureCommunicationTokenCredential(token);
      const client = new ChatClient('https://acs-festive-guest.india.communication.azure.com/', credential);
      chatClientRef.current = client;
      setChatClient(client);

      // 2. Get or Create shared Thread
      console.log('Getting or creating chat thread...');
      const threadRes = await api.post('getorcreatechatthread', {
        userId,
        recipientId
      });
      const tid = threadRes.data.threadId;
      console.log('Thread ID received:', tid);
      tidRef.current = tid;
      setThreadId(tid);

      // 3. Load existing messages
      console.log('Loading message history...');
      const threadClient = client.getChatThreadClient(tid);
      const messagesIterator = threadClient.listMessages();
      const existingMessages = [];
      for await (const message of messagesIterator) {
        if (message.type === 'text') {
          existingMessages.push({
            id: message.id,
            sender: message.sender.communicationUserId === user.communicationUserId ? 'Me' : 'Recipient',
            text: message.content.message,
            timestamp: message.createdOn
          });
        }
      }
      setMessages(existingMessages.reverse());

      // 4. Start Real-time Notifications
      console.log('Starting real-time notifications...');
      await client.startRealtimeNotifications();
      client.on('chatMessageReceived', messageHandler);
      console.log('Chat initialization complete.');

    } catch (e) {
      console.error('Failed to init chat:', e);
      showToast('Failed to initialize chat: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!chatClientRef.current || !tidRef.current) {
      showToast('Chat not fully initialized. Please wait...', 'error');
      return;
    }
    
    try {
      setSending(true);
      const threadClient = chatClientRef.current.getChatThreadClient(tidRef.current);
      const content = newMessage;
      
      console.log('Attempting to send message to ACS...');
      const sendResult = await threadClient.sendMessage({ content });
      console.log('Message sent successfully. ID:', sendResult.id);
      
      setNewMessage('');
      
      setMessages(prev => {
        if (prev.find(m => m.id === sendResult.id)) return prev;
        return [...prev, {
          id: sendResult.id,
          sender: 'Me',
          text: content,
          timestamp: new Date()
        }];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message: ' + error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
      <div className="spinner"></div>
      <p>Initializing secure chat...</p>
    </div>
  );

  return (
    <div className="modern-chat-page">
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type} ${toast.hiding ? 'hiding' : ''}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="toast-content">
              <p className="toast-message">{toast.message}</p>
            </div>
            {toast.type !== 'success' && (
              <button 
                onClick={() => setToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="chat-window-full">
        {/* Chat Header */}
        <div className="chat-header-full">
          <div className="chat-user-info-full">
            <button 
              onClick={() => navigate(-1)}
              className="back-btn-modern"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h3>Secure Chat</h3>
              <span className="user-status">● Online</span>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={m.id || i} className={`message-bubble ${m.sender === 'Me' ? 'sent' : 'received'}`}>
              <div className="message-content">{m.text}</div>
              <div className="message-time">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="chat-input">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..."
            className="message-input"
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={sending}
          >
            {sending ? <span className="spinner-small"></span> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
