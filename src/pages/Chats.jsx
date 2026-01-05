import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

import api from '../utils/api';

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [showChatView, setShowChatView] = useState(false); // For mobile navigation
  const userId = localStorage.getItem('userId');
  const userAcsIdRef = React.useRef(null);

  useEffect(() => {
    if (userId) {
      initializeChat();
    }
  }, [userId]);

  const initializeChat = async () => {
    try {
      const tokenRes = await api.get('issuechattoken', { params: { userId } });
      const { token, user } = tokenRes.data;
      userAcsIdRef.current = user.communicationUserId;
      
      const credential = new AzureCommunicationTokenCredential(token);
      const client = new ChatClient('https://acs-festive-guest.india.communication.azure.com/', credential);
      setChatClient(client);
      
      await fetchConversations(client);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (client) => {
    try {
      const chatThreadsIterator = client.listChatThreads();
      const chatThreads = [];
      
      for await (const chatThread of chatThreadsIterator) {
        const threadClient = client.getChatThreadClient(chatThread.id);
        
        // Get participants to find the other user
        const participantsIterator = threadClient.listParticipants();
        let otherParticipant = null;
        
        for await (const participant of participantsIterator) {
          if (participant.id.communicationUserId !== userAcsIdRef.current) {
            otherParticipant = participant;
            break;
          }
        }
        
        // Get last message
        const messagesIterator = threadClient.listMessages({ maxPageSize: 1 });
        let lastMessage = null;
        
        for await (const message of messagesIterator) {
          if (message.type === 'text') {
            lastMessage = {
              content: message.content.message,
              timestamp: message.createdOn,
              senderId: message.sender.communicationUserId
            };
            break;
          }
        }
        
        if (lastMessage && otherParticipant) {
          // Extract user ID from ACS ID - try different patterns
          const acsId = otherParticipant.id.communicationUserId;
          let otherUserId = null;
          
          // Try different ACS ID patterns
          if (acsId.includes('_')) {
            otherUserId = acsId.split('_')[1];
          } else if (acsId.includes('-')) {
            otherUserId = acsId.split('-').pop();
          } else {
            // If no separator, try to use the whole ID
            otherUserId = acsId;
          }
          
          let userName = 'Unknown User';
          let profileImage = null;
          
          if (otherUserId) {
            try {
              // Try to get user by ID first
              let userRes;
              try {
                userRes = await api.get('getuser', { params: { userId: otherUserId } });
              } catch (e) {
                // If that fails, try searching by role
                console.log('Trying to find user by searching...');
                const guestRes = await api.get('getuser', { params: { role: 'Guest' } });
                const hostRes = await api.get('getuser', { params: { role: 'Host' } });
                
                const allUsers = [
                  ...(Array.isArray(guestRes.data) ? guestRes.data : [guestRes.data]),
                  ...(Array.isArray(hostRes.data) ? hostRes.data : [hostRes.data])
                ].filter(u => u && u.rowKey);
                
                // Find user by matching rowKey with otherUserId
                const foundUser = allUsers.find(u => u.rowKey === otherUserId);
                if (foundUser) {
                  userRes = { data: foundUser };
                }
              }
              
              if (userRes && userRes.data) {
                userName = userRes.data.name || 'Unknown User';
                profileImage = userRes.data.profileImageUrl;
                
                // If profile image exists, try to get the actual URL
                if (profileImage && profileImage.includes('blob.core.windows.net')) {
                  try {
                    const imgRes = await api.get('getimageurl', { params: { userId: otherUserId } });
                    profileImage = imgRes.data.imageUrl;
                  } catch (imgErr) {
                    console.log('Could not get image URL for:', otherUserId);
                  }
                }
              }
            } catch (e) {
              console.log('Could not fetch user data for:', otherUserId, e.message);
            }
          }
          
          chatThreads.push({
            id: chatThread.id,
            name: userName,
            profileImage,
            otherUserId,
            lastMessage
          });
        }
      }
      
      setConversations(chatThreads);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const loadMessages = async (threadId) => {
    if (!chatClient) return;
    
    try {
      const threadClient = chatClient.getChatThreadClient(threadId);
      const messagesIterator = threadClient.listMessages();
      const messagesList = [];
      
      for await (const message of messagesIterator) {
        if (message.type === 'text') {
          messagesList.push({
            id: message.id,
            sender: message.sender.communicationUserId === userAcsIdRef.current ? 'Me' : 'Other',
            text: message.content.message,
            timestamp: message.createdOn
          });
        }
      }
      
      setMessages(messagesList.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedChat(conversation);
    setShowChatView(true); // Show chat view on mobile
    loadMessages(conversation.id);
  };

  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedChat(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !chatClient) return;
    
    try {
      setSending(true);
      const threadClient = chatClient.getChatThreadClient(selectedChat.id);
      const content = newMessage;
      
      const sendResult = await threadClient.sendMessage({ content });
      setNewMessage('');
      
      setMessages(prev => [...prev, {
        id: sendResult.id,
        sender: 'Me',
        text: content,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="chats-container">
        <div className="loading" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <h3>Loading conversations...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="chats-container">
      {/* Conversations Sidebar */}
      <div className={`conversations-sidebar ${showChatView ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <h3>💬 Messages</h3>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(conversation => (
              <div 
                key={conversation.id}
                className={`conversation-item ${selectedChat?.id === conversation.id ? 'active' : ''}`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="conversation-avatar">
                  {conversation.profileImage ? (
                    <img 
                      src={conversation.profileImage} 
                      alt={conversation.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    conversation.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="conversation-content">
                  <div className="conversation-name">{conversation.name}</div>
                  <div className="conversation-preview">
                    {conversation.lastMessage.content}
                  </div>
                </div>
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
              <button 
                className="mobile-back-btn"
                onClick={handleBackToList}
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="conversation-avatar" style={{ width: '32px', height: '32px' }}>
                  {selectedChat.profileImage ? (
                    <img 
                      src={selectedChat.profileImage} 
                      alt={selectedChat.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    selectedChat.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h4>{selectedChat.name}</h4>
              </div>
            </div>
            
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={message.id || index} className={`message ${message.sender === 'Me' ? 'sent' : 'received'}`}>
                  <div className="message-content">{message.text}</div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
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
            <p>Choose a conversation from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;