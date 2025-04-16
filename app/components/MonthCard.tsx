'use client';

import React from 'react';
import styles from './MonthCard.module.css';
import { Event } from '../types';

type MonthCardProps = {
  month: number;
  monthName: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: () => void;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
};

const CATEGORIES = ['壁　面', '制作物', 'その他'] as const;

export default function MonthCard({
  month,
  monthName,
  events,
  onEventClick,
  onAddEvent,
  season
}: MonthCardProps) {
  // カテゴリーごとに最新のイベントを取得
  const getLatestEventByCategory = (events: Event[], category: string) => {
    console.log(`Checking category: ${category}`);
    console.log('Available events:', events);
    
    const filteredEvents = events.filter(event => {
      // カテゴリーの正規化（スペースを削除して比較）
      const normalizedEventCategory = (event.category || '').replace(/\s+/g, '');
      const normalizedCategory = category.replace(/\s+/g, '');
      const match = normalizedEventCategory === normalizedCategory;
      console.log(`Comparing normalized: "${normalizedEventCategory}" with "${normalizedCategory}" = ${match}`);
      return match;
    });

    return filteredEvents.length > 0
      ? filteredEvents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null;
  };

  return (
    <div className={`${styles.monthCard} ${styles[season]}`}>
      <div className={styles.monthHeader}>
        <h2 className={styles.monthTitle}>{monthName}</h2>
      </div>
      
      <div className={styles.eventsList}>
        {CATEGORIES.map((category) => {
          const event = getLatestEventByCategory(events, category);
          return (
            <div key={category} className={styles.categorySection}>
              <div className={styles.categoryLabel} data-category={category}>
                {category}
              </div>
              {event ? (
                <div className={styles.eventItem} onClick={() => onEventClick(event)}>
                  <div className={styles.eventHeader}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                  </div>
                  <div className={styles.eventMeta}>
                    <div className={styles.ageTags}>
                      {event.age_groups?.map((age: string, index: number) => (
                        <span key={index} className={styles.ageTag} data-age={age}>{age}</span>
                      ))}
                    </div>
                    <span className={styles.duration}>{event.duration}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyEvent}>
                  <p className={styles.noEvents}>イベントの登録はありません</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        onClick={onAddEvent} 
        className={styles.addButton}
      >
        イベントを追加
      </button>
    </div>
  );
}