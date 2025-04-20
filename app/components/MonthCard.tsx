'use client';

import React from 'react';
import styles from './MonthCard.module.css';
import { Event, Category } from '../types';
import { useRouter } from 'next/navigation';

interface MonthCardProps {
  month: number;
  monthName: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddClick: () => void;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

const CATEGORIES: Category[] = ['壁　面', '制作物', 'その他'];

const getMonthClass = (month: number): string => {
  switch (month) {
    case 1: return styles.january;
    case 2: return styles.february;
    case 3: return styles.march;
    case 4: return styles.april;
    case 5: return styles.may;
    case 6: return styles.june;
    case 7: return styles.july;
    case 8: return styles.august;
    case 9: return styles.september;
    case 10: return styles.october;
    case 11: return styles.november;
    case 12: return styles.december;
    default: return '';
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ja-JP');
};

const sortEventsByDate = (events: Event[]) => {
  return [...events].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
};

export const MonthCard: React.FC<MonthCardProps> = ({
  month,
  monthName,
  events,
  onEventClick,
  onAddClick
}) => {
  const monthClass = getMonthClass(month);

  const getLatestEventByCategory = (events: Event[], category: Category) => {
    return events.filter(event => event.category === category)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })[0];
  };

  return (
    <div className={`${styles.monthCard} ${monthClass}`}>
      <div className={styles.monthHeader}>
        <h3 className={styles.monthTitle}>
          {monthName}
        </h3>
      </div>
      <div className={styles.eventsContainer}>
        {CATEGORIES.map((category) => {
          const event = getLatestEventByCategory(events, category);
          const columnStyle = category === '壁　面' ? 'wallColumn' : 
                            category === '制作物' ? 'craftColumn' : 'otherColumn';
          
          return (
            <div key={category} className={styles.categorySection}>
              {event ? (
                <div className={styles.eventItem} onClick={() => onEventClick(event)}>
                  <div className={styles.eventHeader}>
                    <div className={`${styles.categoryLabel} ${styles[columnStyle]}`}>
                      {category}
                    </div>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                  </div>
                  <div className={styles.eventMeta}>
                    <div className={styles.ageTags}>
                      {event.age_groups?.map((age, index) => (
                        <span key={`${age}-${index}`} className={styles.ageTag} data-age={age}>{age}</span>
                      ))}
                    </div>
                    <span className={styles.duration}>{event.duration}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyEvent}>
                  <div className={`${styles.categoryLabel} ${styles[columnStyle]}`}>
                    {category}
                  </div>
                  <p className={styles.noEvents}>イベントの登録はありません</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        className={`${styles.addButton} ${styles.defaultButton}`}
        onClick={onAddClick}
      >
        イベントを追加
      </button>
    </div>
  );
};

export default MonthCard;