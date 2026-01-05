import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { X, Send } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

import api from '../utils/api';

const ChatWidget = ({ recipientId, recipientName, onClose }) => {
  const [token, setToken] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { markChatAsActive, markChatAsInactive } = useNotifications();
  
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const initialized = useRef(false);
  const chatClientRef = useRef(null);
  const tidRef = useRef(null);
  const userAcsIdRef = useRef(null);

  const messageHandler = (e) => {
    if (e.threadId === tidRef.current && e.sender.communicationUserId !== userAcsIdRef.current) {
      setMessages(prev => {
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
        chatClientRef.current.off('chatMessageReceived', messageHandler);
        chatClientRef.current.stopRealtimeNotifications().catch(console.error);
        chatClientRef.current = null;
      }
      // Mark chat as inactive when component unmounts
      if (tidRef.current) {
        markChatAsInactive(tidRef.current);
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
      
      const tokenRes = await api.get('issuechattoken', { params: { userId } });
      const { token, user } = tokenRes.data;
      setToken(token);
      userAcsIdRef.current = user.communicationUserId;

      const credential = new AzureCommunicationTokenCredential(token);
      const client = new ChatClient('https://acs-festive-guest.india.communication.azure.com/', credential);
      chatClientRef.current = client;
      setChatClient(client);

      const threadRes = await api.post('getorcreatechatthread', {
        userId,
        recipientId
      });
      const tid = threadRes.data.threadId;
      tidRef.current = tid;
      setThreadId(tid);

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

      await client.startRealtimeNotifications();
      client.on('chatMessageReceived', messageHandler);
      
      // Mark this chat as active to prevent notifications
      markChatAsActive(tid);

    } catch (e) {
      console.error('Failed to init chat:', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!chatClientRef.current || !tidRef.current) return;
    
    try {
      setSending(true);
      const threadClient = chatClientRef.current.getChatThreadClient(tidRef.current);
      const content = newMessage;
      
      const sendResult = await threadClient.sendMessage({ content });
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
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="chat-widget loading">
        <div className="chat-header">
          <span>Loading chat...</span>
          <button onClick={onClose} className="close-btn"><X size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">👤</div>
          <div>
            <div className="user-name">{recipientName || 'Chat'}</div>
            <div className="user-status">● Online</div>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">
          <X size={16} />
        </button>
      </div>
      
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={m.id || i} className={`message ${m.sender === 'Me' ? 'sent' : 'received'}`}>
            <div className="message-content">{m.text}</div>
            <div className="message-time">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
};

export default ChatWidget;