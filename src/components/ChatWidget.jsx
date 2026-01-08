import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import chatService from '../utils/chatService';
import api from '../utils/api';

const ChatWidget = ({ recipientId, recipientName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const messageHandlerRef = useRef(null);

  useEffect(() => {
    initChat();
    return () => {
      if (messageHandlerRef.current) {
        chatService.offReceiveMessage(messageHandlerRef.current);
      }
    };
  }, [recipientId]);

  const initChat = async () => {
    try {
      setLoading(true);
      await chatService.connect();
      
      console.log('🔗 Joining chat with:', recipientId);
      await chatService.joinChat(recipientId);
      console.log('✅ Joined chat successfully');
      
      // Setup event listeners FIRST before loading history
      messageHandlerRef.current = (data) => {
        console.log('📨 Message received:', data);
        if (data.senderId === recipientId) {
          setMessages(prev => {
            if (prev.find(m => m.id === data.id)) return prev;
            
            const newMsg = {
              id: data.id,
              sender: 'Recipient',
              text: data.message,
              timestamp: new Date(data.timestamp),
              status: data.status?.toLowerCase() || 'sent'
            };
            
            const chatRoom = `chat_${[userId, recipientId].sort().join('_')}`;
            console.log('📤 Calling MarkDelivered:', data.id, chatRoom);
            chatService.markDelivered(data.id, chatRoom);
            
            // When we receive a message, refresh status of our sent messages
            setTimeout(async () => {
              try {
                const historyRes = await api.get(`chat/messages/${recipientId}`);
                if (historyRes.data) {
                  setMessages(prevMsgs => prevMsgs.map(m => {
                    const updated = historyRes.data.find(h => h.id === m.id);
                    if (updated && m.sender === 'Me') {
                      console.log(`Refreshed status for ${m.id}: ${updated.status}`);
                      return { ...m, status: updated.status?.toLowerCase() };
                    }
                    return m;
                  }));
                }
              } catch (e) { console.error('Failed to refresh status:', e); }
            }, 500);
            
            return [...prev, newMsg];
          });
        } else {
          console.log('⚠️ Ignoring message from self or other user');
        }
      };
      
      chatService.onReceiveMessage(messageHandlerRef.current);

      chatService.onMessageStatusUpdated((data) => {
        console.log('✅ Status updated event received:', data);
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.id === data.messageId) {
              console.log(`Updating message ${m.id} from ${m.status} to ${data.status}`);
              return { ...m, status: data.status?.toLowerCase() || m.status };
            }
            return m;
          });
          return updated;
        });
      });

      chatService.onError((error) => {
        console.error('Chat error:', error);
      });
      
      // Load message history AFTER setting up listeners
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
        }
      } catch (historyError) {
        console.error('Failed to load message history:', historyError);
      }
      
      setConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
    
    const chatRoom = `chat_${[userId, recipientId].sort().join('_')}`;
    messages.forEach(m => {
      if (m.sender === 'Recipient' && m.id && m.status !== 'read') {
        console.log('📖 Marking as read:', m.id, chatRoom);
        chatService.markRead(m.id, chatRoom);
      }
    });
  }, [messages, userId, recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;
    
    try {
      setSending(true);
      const messageText = newMessage;
      setNewMessage('');
      
      await chatService.sendMessage(recipientId, messageText);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'Me',
        text: messageText,
        timestamp: new Date(),
        status: 'sent'
      }]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">👤</div>
          <div>
            <div className="user-name">{recipientName || 'Chat'}</div>
            <div className="user-status">● {connected ? 'Online' : 'Connecting...'}</div>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">
          <X size={16} />
        </button>
      </div>
      
      <div className="chat-messages">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Start a conversation with {recipientName}
          </div>
        ) : (
          messages.map((m, i) => {
            console.log('Rendering message:', { id: m.id, status: m.status, sender: m.sender });
            return (
            <div key={m.id || i} className={`message ${m.sender === 'Me' ? 'sent' : 'received'}`}>
              <div className="message-content">{m.text}</div>
              <div style={{ fontSize: '11px', color: '#65676b', marginTop: '2px', textAlign: 'center' }}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {m.sender === 'Me' && (
                  <span style={{ 
                    marginLeft: '4px',
                    color: m.status === 'read' ? '#4ade80' : '#65676b',
                    fontWeight: '500'
                  }}>
                    {m.status === 'read' ? 'Read' : m.status === 'delivered' ? 'Delivered' : 'Sent'}
                  </span>
                )}
              </div>
            </div>
          )})
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
        />
        <button type="submit" className="send-btn" disabled={sending}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;