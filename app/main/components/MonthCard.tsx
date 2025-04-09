import React from 'react';
import styles from './MonthCard.module.css';

interface Event {
  id: string;
  month: number;
  title: string;
  description: string;
}

interface MonthCardProps {
  month: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: () => void;
}

const MonthCard: React.FC<MonthCardProps> = ({ month, events, onEventClick, onAddEvent }) => {
  // Get season-appropriate accent color
  const getSeasonColor = () => {
    const monthIndex = parseInt(month) - 1;
    
    // Spring (3-5)
    if (monthIndex >= 2 && monthIndex <= 4) {
      return '#FF0000'; // Red for spring
    }
    // Summer (6-8)
    else if (monthIndex >= 5 && monthIndex <= 7) {
      return '#FFFF00'; // Yellow for summer
    }
    // Fall (9-11)
    else if (monthIndex >= 8 && monthIndex <= 10) {
      return '#FF5500'; // Orange for fall (mix of red and yellow)
    }
    // Winter (12-2)
    else {
      return '#0000FF'; // Blue for winter
    }
  };

  const seasonColor = getSeasonColor();
  
  return (
    <div className={styles.monthCard} style={{ '--accent-color': seasonColor } as React.CSSProperties}>
      <h2 className={styles.monthTitle}>{month}</h2>
      
      <ul className={styles.eventsList}>
        {events.slice(0, 3).map((event) => (
          <li key={event.id} className={styles.eventItem} onClick={() => onEventClick(event)}>
            {event.title}
          </li>
        ))}
        
        {events.length === 0 && (
          <li className={styles.noEvents}>イベントがありません</li>
        )}
      </ul>
      
      {events.length < 3 && (
        <button onClick={onAddEvent} className={styles.addButton}>
          + 新規イベント
        </button>
      )}
    </div>
  );
};

export default MonthCard;
