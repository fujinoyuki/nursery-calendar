'use client';

import { useState } from 'react';
import EventDetailModal from './EventDetailModal';

export default function EventItem({ event }) {
  const [showDetail, setShowDetail] = useState(false);

  const openDetail = () => {
    console.log("Opening detail for:", event.title);
    setShowDetail(true);
  };

  const closeDetail = () => {
    console.log("Closing detail");
    setShowDetail(false);
  };

  return (
    <>
      <li 
        className="event-item" 
        onClick={openDetail}
        style={{
          position: 'relative',
          padding: '0.75rem',
          borderBottom: '2px solid var(--color-text)',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{event.title}</span>
        <span 
          style={{ 
            position: 'absolute', 
            right: '1rem',
            color: 'var(--color-accent-2)',
            fontWeight: 'bold'
          }}
        >
          →
        </span>
      </li>

      {showDetail && (
        <EventDetailModal event={event} onClose={closeDetail} />
      )}
    </>
  );
}