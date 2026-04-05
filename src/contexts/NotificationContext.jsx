import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import chatService from '../utils/chatService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const POLL_INTERVAL = 30000;

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const signalRConnectedRef = useRef(false);
  const activeConversationRef = useRef(null);

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.userId || user.id || null;
    } catch {
      return null;
    }
  };

  const isLoggedIn = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return !!(user.token && (user.userId || user.id));
    } catch {
      return false;
    }
  };

  const showMessageToast = useCallback((senderName) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ senderName });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const setActiveConversation = useCallback((otherUserId) => {
    activeConversationRef.current = otherUserId;
  }, []);

  const clearActiveConversation = useCallback(() => {
    activeConversationRef.current = null;
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const response = await api.get('chat/conversations');
      const conversations = response.data || [];
      const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch {
      // Silently fail
    }
  }, []);

  // Poll for unread count
  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchUnreadCount();
    pollTimerRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchUnreadCount]);

  // SignalR for instant toast notifications
  useEffect(() => {
    if (!isLoggedIn() || signalRConnectedRef.current) return;
    let mounted = true;

    const handleMessage = (data) => {
      if (!mounted) return;
      const currentUserId = getUserId();
      if (data.senderId && data.senderId !== currentUserId) {
        if (data.senderId !== activeConversationRef.current) {
          showMessageToast(data.senderName || 'Someone');
        }
        fetchUnreadCount();
      }
    };

    const connectSignalR = async () => {
      try {
        await chatService.connect();
        signalRConnectedRef.current = true;
        chatService.onReceiveMessage(handleMessage);
      } catch (err) {
        console.warn('Global SignalR connection failed, relying on polling:', err.message);
      }
    };

    connectSignalR();
    return () => {
      mounted = false;
      chatService.offReceiveMessage(handleMessage);
    };
  }, [showMessageToast, fetchUnreadCount]);

  // Re-check on user login/logout
  useEffect(() => {
    const handleStorageChange = () => {
      if (!isLoggedIn()) {
        signalRConnectedRef.current = false;
        setUnreadCount(0);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      } else {
        fetchUnreadCount();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      fetchUnreadCount,
      setActiveConversation,
      clearActiveConversation,
      toast,
      dismissToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
