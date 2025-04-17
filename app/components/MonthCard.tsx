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

interface MonthDecoration {
  leftClass: string;
  rightClass: string;
  left: string;
  right: string;
}

const getMonthDecoration = (month: number): MonthDecoration => {
  switch (month) {
    case 1:
      return {
        leftClass: 'blueDecoration',
        rightClass: 'blueDecoration',
        left: '❆',
        right: '❆'
      };
    case 2:
      return {
        leftClass: 'pinkDecoration',
        rightClass: 'pinkDecoration',
        left: '♥',
        right: '♥'
      };
    case 3:
      return {
        leftClass: 'pinkDecoration',
        rightClass: 'pinkDecoration',
        left: '✿',
        right: '✿'
      };
    case 4:
      return {
        leftClass: 'pinkDecoration',
        rightClass: 'pinkDecoration',
        left: '✿',
        right: '✿'
      };
    case 5:
      return {
        leftClass: 'greenDecoration',
        rightClass: 'greenDecoration',
        left: '☘',
        right: '☘'
      };
    case 6:
      return {
        leftClass: 'purpleDecoration',
        rightClass: 'purpleDecoration',
        left: '✿',
        right: '✿'
      };
    case 7:
      return {
        leftClass: 'orangeDecoration',
        rightClass: 'orangeDecoration',
        left: '☀',
        right: '☀'
      };
    case 8:
      return {
        leftClass: 'blueDecoration',
        rightClass: 'blueDecoration',
        left: '☆',
        right: '☆'
      };
    case 9:
      return {
        leftClass: 'yellowDecoration',
        rightClass: 'yellowDecoration',
        left: '☾',
        right: '☾'
      };
    case 10:
      return {
        leftClass: 'orangeDecoration',
        rightClass: 'orangeDecoration',
        left: '♣',
        right: '♣'
      };
    case 11:
      return {
        leftClass: 'brownDecoration',
        rightClass: 'brownDecoration',
        left: '❋',
        right: '❋'
      };
    case 12:
      return {
        leftClass: 'blueDecoration',
        rightClass: 'blueDecoration',
        left: '❆',
        right: '❆'
      };
    default:
      return {
        leftClass: 'defaultDecoration',
        rightClass: 'defaultDecoration',
        left: '•',
        right: '•'
      };
  }
};

export default function MonthCard({
  month,
  monthName,
  events,
  onEventClick,
  onAddEvent,
  season
}: MonthCardProps) {
  const decoration = getMonthDecoration(month);
  
  const getLatestEventByCategory = (events: Event[], category: string) => {
    const filteredEvents = events.filter(event => {
      const normalizedEventCategory = (event.category || '').replace(/\s+/g, '');
      const normalizedCategory = category.replace(/\s+/g, '');
      return normalizedEventCategory === normalizedCategory;
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
        <h2 className={styles.monthTitle}>
          <span className={`${styles.monthDecoration} ${styles[decoration.leftClass]}`}>
            {decoration.left}
          </span>
          {monthName}
          <span className={`${styles.monthDecoration} ${styles[decoration.rightClass]}`}>
            {decoration.right}
          </span>
        </h2>
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
                      {event.age_groups?.map((age: string, index: number) => (
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
        onClick={onAddEvent} 
        className={styles.addButton}
      >
        イベントを追加
      </button>
    </div>
  );
}