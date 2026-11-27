import { Ticket, House } from 'lucide-react';

/** "About: (post title)" above messages sent from a post's card, set like a date line (placement: utils/chatAbout). */
const ChatAbout = ({ about }) => {
  const Icon = about.kind === 'listing' ? House : Ticket;
  return (
    <div className="chat-about">
      <span title={about.title}><Icon size={13} aria-hidden="true" /> About: <strong>{about.title}</strong></span>
    </div>
  );
};

export default ChatAbout;
