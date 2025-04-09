import React, { useEffect } from 'react';
import styles from './EventOverlay.module.css';

interface Event {
  id: string;
  month: number;
  title: string;
  description: string;
}

interface EventOverlayProps {
  event: Event;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const EventOverlay: React.FC<EventOverlayProps> = ({ event, onClose, onDelete }) => {
  // Add event listener for escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  // Prevent click propagation from content to overlay
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={handleContentClick}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        
        <h2 className={styles.eventTitle}>{event.title}</h2>
        
        <div className={styles.eventDescription}>
          {event.description.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        <div className={styles.actions}>
          <button
            className={styles.deleteButton}
            onClick={() => onDelete(event.id)}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventOverlay;
