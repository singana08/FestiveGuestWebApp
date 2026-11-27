import { useState, useEffect, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Search, Lock, UserRound, ShieldCheck, X, ArrowRight } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import api from '../utils/api';
import { toast } from '../utils/feedback';
import { LoadError } from '../components/Feedback';
import ImageWithSas from '../components/ImageWithSas';
import ProfileModal from '../components/posts/ProfileModal';
import SafetyActions from '../components/SafetyActions';
import StayPanel from '../components/StayPanel';
import ChatAbout from '../components/ChatAbout';
import { aboutStarts } from '../utils/chatAbout';
import { useNotifications } from '../contexts/NotificationContext';
import '../styles/Register.css';
import '../styles/PostsBoard.css';
import '../styles/Chats.css';

// Tapping one fills the box (not sent), so it can be edited first.
const QUICK_REPLIES = ['Thank you! 🙏', 'Sounds good 👍', 'Can you share a few more details?', "I'll get back to you shortly."];

const Avatar = ({ url, name, size = 'md' }) => (
  <span className={`ch-avatar ch-avatar--${size}`} aria-hidden="true">
    {url ? <ImageWithSas src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name || '?').charAt(0).toUpperCase()}
  </span>
);

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const dayLabel = (d) => {
  const day = new Date(d);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()) - new Date(day.toDateString())) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(day.getFullYear() !== today.getFullYear() && { year: 'numeric' }) });
};
const timeOf = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const listTime = (d) => (sameDay(d, new Date()) ? timeOf(d) : dayLabel(d));

const Chats = () => {
  useSEO({ title: 'Messages', noindex: true });
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [listFailed, setListFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState('');

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
  const inputRef = useRef(null);
  const selectedChatRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const { fetchUnreadCount, setActiveConversation, clearActiveConversation } = useNotifications();

  // Lock the page to the viewport so only the message list scrolls (App.css "body.chat-active").
  useEffect(() => {
    document.body.classList.add('chat-active');
    return () => {
      document.body.classList.remove('chat-active');
      clearActiveConversation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  // /chats?with=<memberId>&name=<name> opens that conversation (used by My trips and trip cards).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withId = params.get('with');
    if (withId) handleConversationClick({ otherUserId: withId, otherUserName: params.get('name') || 'Member', lastMessage: '', timestamp: new Date().toISOString(), unreadCount: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival
  }, []);

  // Auto-scroll only when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Single poll: refresh conversations + active chat messages
  useEffect(() => {
    fetchConversations(true);
    const poll = setInterval(() => {
      fetchConversations(false);
      const current = selectedChatRef.current;
      if (current?.otherUserId) refreshMessages(current.otherUserId);
    }, 5000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversations = async (showLoader) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get('chat/conversations');
      setConversations((response.data || []).map((conv) => ({
        ...conv,
        otherUserName: conv.otherUserName || 'Unknown User',
        lastMessage: conv.lastMessage || '',
        timestamp: conv.timestamp || new Date().toISOString(),
        unreadCount: conv.unreadCount || 0,
      })));
      setListFailed(false);
    } catch {
      setListFailed(true); // the 30-second refresh keeps retrying
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const markAllRead = async (otherUserId) => {
    try { await api.post(`chat/mark-read-all/${otherUserId}`); } catch { /* endpoint may not be deployed yet */ }
  };

  const toMessages = (data) => data.map((msg) => ({
    id: msg.id,
    sender: msg.senderId === userId ? 'Me' : 'Recipient',
    text: msg.message || '',
    timestamp: new Date(msg.timestamp),
    status: msg.status || 'sent',
    about: msg.about || null,
  }));

  const refreshMessages = async (recipientId) => {
    try {
      const response = await api.get(`chat/messages/${recipientId}`);
      if (!Array.isArray(response.data)) return;
      const serverMessages = toMessages(response.data);
      setMessages((prev) => (serverMessages.length >= prev.length ? serverMessages : prev));
    } catch { /* silent on poll */ }
  };

  const loadMessages = async (recipientId) => {
    try {
      const response = await api.get(`chat/messages/${recipientId}`);
      setMessages(Array.isArray(response.data) ? toMessages(response.data) : []);
    } catch {
      setMessages([]);
      toast('Couldn’t load this chat. Check your connection and try again.', 'error');
    }
  };

  const handleConversationClick = async (conversation) => {
    if (selectedChat?.otherUserId !== conversation.otherUserId) setMessages([]);
    setSelectedChat(conversation);
    if (!conversation.otherUserId) return;
    await loadMessages(conversation.otherUserId);
    setShowChatView(true);
    await markAllRead(conversation.otherUserId);
    setActiveConversation(conversation.otherUserId);
    await fetchConversations(false);
    fetchUnreadCount();
  };

  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedChat(null);
    setMessages([]);
    clearActiveConversation();
    fetchConversations(false).then(() => fetchUnreadCount());
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;
    const content = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    setNewMessage('');
    setSending(true);
    setMessages((prev) => [...prev, { id: tempId, sender: 'Me', text: content, timestamp: new Date(), status: 'Sending…' }]);
    try {
      await api.post('chat/send', { recipientId: selectedChat.otherUserId, message: content });
      await refreshMessages(selectedChat.otherUserId);
      fetchConversations(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      // A successful refresh replaces the temp entry; on failure mark it so it doesn't sit on "Sending…".
      const status = error.response?.status === 403 ? 'Not sent — you can’t message this member' : 'Failed to send';
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status } : m)));
    } finally {
      setSending(false);
    }
  };

  const applyQuickReply = (text) => { setNewMessage(text); inputRef.current?.focus(); };

  const q = query.trim().toLowerCase();
  const shown = q ? conversations.filter((cv) => cv.otherUserName.toLowerCase().includes(q)) : conversations;
  const unreadTotal = conversations.reduce((s, cv) => s + (cv.unreadCount || 0), 0);
  const lastMsg = messages[messages.length - 1];
  const showQuick = !newMessage && lastMsg && lastMsg.sender !== 'Me';
  const aboutAt = aboutStarts(messages); // where an "About: (post)" line goes

  return (
    <div className="ch">
      <div className="rg-aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>

      {/* ═════ Inbox ═════ */}
      <aside className={`ch-inbox${showChatView ? ' is-hidden-mobile' : ''}`} aria-label="Conversations">
        <header className="ch-inbox-head">
          <h1>Messages {unreadTotal > 0 && <span className="ch-unread-total">{unreadTotal} new</span>}</h1>
          <label className="ch-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" aria-label="Search chats" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
          </label>
        </header>

        <div className="ch-list">
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="ch-conv-sk" aria-hidden="true"><span className="pb-sk ch-sk-avatar" /><span className="ch-sk-lines"><span className="pb-sk pb-sk--line" /><span className="pb-sk pb-sk--line pb-sk--short" /></span></div>
            ))
          ) : listFailed && conversations.length === 0 ? (
            <LoadError what="your chats" onRetry={() => fetchConversations(true)} />
          ) : conversations.length === 0 ? (
            <div className="ch-list-empty">
              <span className="ch-empty-icon"><MessageCircle size={22} /></span>
              <strong>No conversations yet</strong>
              <p>Message a host or offer to host from the Posts board — your chats appear here.</p>
              <Link to="/posts" className="rg-btn rg-btn-primary ch-inline-btn">Browse posts <ArrowRight size={15} /></Link>
            </div>
          ) : shown.length === 0 ? (
            <p className="ch-list-none">No chats match “{query}”.</p>
          ) : (
            <ul>
              {shown.map((conv) => {
                const active = selectedChat?.otherUserId === conv.otherUserId;
                return (
                  <li key={conv.chatRoom || conv.otherUserId}>
                    <button type="button" className={`ch-conv${active ? ' is-active' : ''}${conv.unreadCount > 0 ? ' is-unread' : ''}`}
                      aria-current={active ? 'true' : undefined} onClick={() => handleConversationClick(conv)}>
                      <Avatar url={conv.profileImageUrl} name={conv.otherUserName} />
                      <span className="ch-conv-text">
                        <span className="ch-conv-top">
                          <strong>{conv.otherUserName}</strong>
                          <time>{listTime(conv.timestamp)}</time>
                        </span>
                        <span className="ch-conv-bottom">
                          <span className="ch-preview">{conv.lastSenderId === userId ? 'You: ' : ''}{conv.lastMessage || 'Start chatting'}</span>
                          {conv.unreadCount > 0 && <span className="ch-badge">{conv.unreadCount}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ═════ Conversation ═════ */}
      <section className={`ch-pane${showChatView ? ' is-open-mobile' : ''}`} aria-label={selectedChat ? `Chat with ${selectedChat.otherUserName}` : 'Conversation'}>
        {selectedChat ? (
          <>
            <header className="ch-pane-head">
              <button type="button" className="ch-back" onClick={handleBackToList} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
              <button type="button" className="ch-who" onClick={() => setProfile({ userId: selectedChat.otherUserId, userName: selectedChat.otherUserName })}>
                <Avatar url={selectedChat.profileImageUrl} name={selectedChat.otherUserName} />
                <span>
                  <strong>{selectedChat.otherUserName}</strong>
                  <small><Lock size={11} /> Private chat · your number stays hidden</small>
                </span>
              </button>
              <button type="button" className="ch-head-btn" onClick={() => setProfile({ userId: selectedChat.otherUserId, userName: selectedChat.otherUserName })}>
                <UserRound size={15} /> <span>View profile</span>
              </button>
              <SafetyActions className="ch-safety" userId={selectedChat.otherUserId} userName={selectedChat.otherUserName} context="chat"
                onBlockChange={(b) => { if (b) handleBackToList(); }} />
            </header>
            <StayPanel key={selectedChat.otherUserId} otherUserId={selectedChat.otherUserId} otherName={selectedChat.otherUserName} meId={userId}
              onMessage={() => { refreshMessages(selectedChat.otherUserId); fetchConversations(false); }} />

            <div className="ch-msgs">
              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const newDay = !prev || !sameDay(prev.timestamp, msg.timestamp);
                const first = newDay || prev.sender !== msg.sender;
                const last = !next || next.sender !== msg.sender || !sameDay(next.timestamp, msg.timestamp);
                const mine = msg.sender === 'Me';
                const failed = msg.status === 'Failed to send' || msg.status?.startsWith('Not sent');
                return (
                  <Fragment key={msg.id || i}>
                    {newDay && <div className="ch-day"><span>{dayLabel(msg.timestamp)}</span></div>}
                    {aboutAt[i] && <ChatAbout about={msg.about} />}
                    <div className={`ch-msg${mine ? ' is-me' : ''}${first ? ' is-first' : ''}${last ? ' is-last' : ''}`}>
                      <div className="ch-bubble">{msg.text}</div>
                      {(last || failed) && (
                        <div className={`ch-meta${failed ? ' is-failed' : ''}`}>
                          {timeOf(msg.timestamp)}{mine && msg.status && msg.status !== 'sent' && ` · ${msg.status}`}
                        </div>
                      )}
                    </div>
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {showQuick && (
              <div className="ch-quick" aria-label="Quick replies">
                {QUICK_REPLIES.map((r) => <button key={r} type="button" className="pb-chip" onClick={() => applyQuickReply(r)}>{r}</button>)}
              </div>
            )}
            <form onSubmit={sendMessage} className="ch-compose">
              <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedChat.otherUserName.split(' ')[0]}…`} aria-label="Message" />
              <button type="submit" className="ch-send" disabled={sending || !newMessage.trim()} aria-label="Send"><Send size={17} /></button>
            </form>
          </>
        ) : (
          <div className="ch-welcome">
            <div className="ch-bubbles" aria-hidden="true">
              <span className="ch-fb ch-fb--1">Hi! Is the room near the metro? 🚇</span>
              <span className="ch-fb ch-fb--2">Yes — 5 min walk. Welcome! 🙏</span>
            </div>
            <h2>Pick a conversation</h2>
            <p>Your chats with hosts and travellers stay private inside FestiveGuest.</p>
            <ul className="ch-tips">
              <li><MessageCircle size={15} /> Introduce yourself and why you’re travelling</li>
              <li><ShieldCheck size={15} /> Meet in a public place first</li>
            </ul>
            <Link to="/safety-guidelines" className="pb-panel-link">Safety guidelines <ArrowRight size={15} /></Link>
          </div>
        )}
      </section>

      <ProfileModal key={profile?.userId || 'none'} open={!!profile} userId={profile?.userId} userName={profile?.userName} onClose={() => setProfile(null)} />
    </div>
  );
};

export default Chats;
