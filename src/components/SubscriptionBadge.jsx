import React from 'react';

const SubscriptionBadge = ({ status }) => {
  const badges = {
    free: { text: 'Free', color: '#64748b', bg: '#f1f5f9' },
    pending: { text: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
    paid: { text: 'Premium', color: '#10b981', bg: '#dcfce7' }
  };
  
  const badge = badges[status] || badges.free;
  
  return (
    <span style={{ 
      fontWeight: '600', 
      color: badge.color,
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      background: badge.bg,
      fontSize: '0.85rem',
      display: 'inline-block'
    }}>
      {badge.text}
    </span>
  );
};

export default SubscriptionBadge;
