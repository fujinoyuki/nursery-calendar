import React from 'react';
import styles from './MonthCard.module.css';
import { Event } from '../../types';

interface MonthCardProps {
  month: number;
  monthName: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: (month: number) => void;
}

export default function MonthCard({
  month,
  monthName,
  events,
  onEventClick,
  onAddEvent
}: MonthCardProps) {
  const getSeason = (month: number) => {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  return (
    <div className={`${styles.monthCard} ${styles[getSeason(month)]}`}>
      <h2 className={styles.monthTitle}>{monthName}</h2>
      <div className={styles.eventList}>
        {events.map((event) => (
          <div
            key={event.id}
            className={styles.eventItem}
            onClick={() => onEventClick(event)}
          >
            <span className={styles.eventDate}>{event.date}</span>
            <span className={styles.eventTitle}>{event.title}</span>
          </div>
        ))}
      </div>
      <button onClick={() => onAddEvent(month)} className={styles.addButton}>
        イベントを追加
      </button>
    </div>
  );
}
