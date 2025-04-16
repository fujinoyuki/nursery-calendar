import React from 'react';
import styles from './MonthCard.module.css';
import { Event } from '../../types';

interface MonthCardProps {
  month: number;
  monthName: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: (month: number) => void;
  season: string;
}

export default function MonthCard({
  month,
  monthName,
  events,
  onEventClick,
  onAddEvent,
  season
}: MonthCardProps) {
  const getSeason = (month: number) => {
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'autumn';
  };

  return (
    <div className={`${styles.monthContainer} ${styles[season]}`}>
      <h2 className={styles.monthTitle}>{monthName}</h2>
      <div className={styles.eventList}>
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className={styles.eventItem}
              onClick={() => onEventClick(event)}
            >
              <h3 className={styles.eventTitle}>{event.title}</h3>
              <div className={styles.eventDetails}>
                <span>{event.age_group}</span>
                <span>{event.category}</span>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noEvents}>イベントはまだありません</p>
        )}
      </div>
      <button
        className={styles.addButton}
        onClick={() => onAddEvent(month)}
      >
        イベントを追加
      </button>
    </div>
  );
}
