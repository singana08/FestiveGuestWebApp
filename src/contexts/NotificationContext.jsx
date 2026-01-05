import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { MessageCircle, X } from 'lucide-react';

import api from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatClient, setChatClient] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeChats, setActiveChats] = useState(new Set());
  const chatClientRef = useRef(null);
  const userAcsIdRef = useRef(null);
  const userId = localStorage.getItem('userId');

  // Initialize global chat listener
  useEffect(() => {
    if (userId && !isInitialized) {
      initGlobalChat();
    }

    return () => {
      if (chatClientRef.current) {
        chatClientRef.current.off('chatMessageReceived', handleGlobalMessage);
        chatClientRef.current.stopRealtimeNotifications().catch(console.error);
      }
    };
  }, [userId]);

  const initGlobalChat = async () => {
    try {
      const tokenRes = await api.get('issuechattoken', { params: { userId } });
      const { token, user } = tokenRes.data;
      userAcsIdRef.current = user.communicationUserId;

      const credential = new AzureCommunicationTokenCredential(token);
      const client = new ChatClient('https://acs-festive-guest.india.communication.azure.com/', credential);
      
      chatClientRef.current = client;
      setChatClient(client);

      await client.startRealtimeNotifications();
      client.on('chatMessageReceived', handleGlobalMessage);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize global chat:', error);
    }
  };

  const handleGlobalMessage = (e) => {
    // Only count messages from others and if chat is not currently open
    if (e.sender.communicationUserId !== userAcsIdRef.current && !activeChats.has(e.threadId)) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markChatAsActive = (threadId) => {
    setActiveChats(prev => new Set([...prev, threadId]));
  };

  const markChatAsInactive = (threadId) => {
    setActiveChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(threadId);
      return newSet;
    });
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      clearUnreadCount,
      markChatAsActive,
      markChatAsInactive,
      chatClient: chatClientRef.current
    }}>
      {children}
    </NotificationContext.Provider>
  );
};