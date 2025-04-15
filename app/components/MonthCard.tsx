'use client';

import React from 'react';
import styles from './MonthCard.module.css';
import { Event } from '../types';

interface MonthCardProps {
  month: number;
  monthName: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: () => void;
}

export default function MonthCard({ month, monthName, events, onEventClick, onAddEvent }: MonthCardProps) {
  // 月に基づいて季節のクラスを決定
  const getSeasonClass = () => {
    if (month >= 3 && month <= 5) return styles.spring;
    if (month >= 6 && month <= 8) return styles.summer;
    if (month >= 9 && month <= 11) return styles.autumn;
    return styles.winter;
  };

  // イベントを日付でソート
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className={`${styles.monthCard} ${getSeasonClass()}`}>
      <h3 className={styles.monthName}>{monthName}</h3>
      <div className={styles.eventList}>
        {sortedEvents.map(event => (
          <div
            key={event.id}
            className={styles.eventItem}
            onClick={() => onEventClick(event)}
          >
            <div className={styles.eventDate}>
              {new Date(event.date).toLocaleDateString('ja-JP')}
            </div>
            <div className={styles.eventTitle}>{event.title}</div>
            <div className={styles.eventMeta}>
              <span className={styles.ageGroup}>{event.age_group}</span>
              <span className={styles.category}>{event.category}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        className={styles.addButton}
        onClick={onAddEvent}
        aria-label={`${monthName}のイベントを追加`}
      >
        ＋
      </button>
    </div>
  );
} 