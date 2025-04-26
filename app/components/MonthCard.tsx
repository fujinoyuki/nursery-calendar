'use client';

import React from 'react';
import styles from './MonthCard.module.css';
import { Event, Category } from '../types/event';
import { useRouter } from 'next/navigation';

interface MonthCardProps {
  month: number;
  monthName: string;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddClick: () => void;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  newEventId?: string | null;
}

const CATEGORIES: Category[] = ['壁　面', '制作物', 'その他'];

// 年齢グループをソートする関数
const sortAgeGroups = (ages: string[] = []) => {
  const ageOrder = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
  return [...ages].sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));
};

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

// 所要時間をフォーマットする関数
const formatDuration = (duration: { start?: string, end?: string } | string | null | undefined) => {
  // 値が存在しない場合
  if (!duration) return '不明';
  
  // 文字列の場合はJSONとしてパース
  if (typeof duration === 'string') {
    try {
      const parsedDuration = JSON.parse(duration);
      return formatDuration(parsedDuration);
    } catch (e) {
      // 時間と分を抽出（例: "2時間30分"）
      const durationStr = duration as string;
      const hoursMatch = durationStr.match(/(\d+)時間/);
      const minutesMatch = durationStr.match(/(\d+)分/);
      
      if (hoursMatch || minutesMatch) {
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        
        if (hours > 0 && minutes > 0) {
          return `${hours}時間${minutes}分`;
        } else if (hours > 0) {
          return `${hours}時間`;
        } else if (minutes > 0) {
          return `${minutes}分`;
        }
      }
      return durationStr;
    }
  }
  
  // オブジェクトの場合はend値を使う
  const durationObj = duration as { start?: string, end?: string };
  const end = durationObj.end;
  if (!end) return '不明';
  
  // HH:MM形式の場合
  const timeMatch = end.match(/^(\d{1,2}):(\d{1,2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}時間${minutes}分`;
    } else if (hours > 0) {
      return `${hours}時間`;
    } else if (minutes > 0) {
      return `${minutes}分`;
    }
  }
  
  return end;
};

export const MonthCard: React.FC<MonthCardProps> = ({
  month,
  monthName,
  events,
  onEventClick,
  onAddClick,
  newEventId
}) => {
  const monthClass = getMonthClass(month);

  const getLatestEventByCategory = (events: Event[], category: Category) => {
    // カテゴリーの正規化（全角スペースと空白を考慮）
    const normalizedCategory = category.replace(/\s+/g, '　').trim();
    
    return events.filter(event => {
      // カテゴリー判定ロジック
      const eventCategory = event.category?.replace(/\s+/g, '　').trim() || '';
      
      // デバッグログ
      console.log('カテゴリー判定:', {
        期待: normalizedCategory,
        実際: eventCategory,
        元の値: event.category
      });

      // 「その他」カテゴリーの場合
      if (normalizedCategory === 'その他') {
        return eventCategory !== '壁　面' && eventCategory !== '制作物';
      }

      return eventCategory === normalizedCategory;
    })
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
        {CATEGORIES.map(category => {
          const event = getLatestEventByCategory(events, category);
          const columnStyle = category === '壁　面' ? 'wallColumn' : 
                            category === '制作物' ? 'craftColumn' : 'otherColumn';
          
          console.log(`${monthName}の${category}:`, event);
          
          return (
            <div key={category} className={styles.categorySection}>
              {event ? (
                <div 
                  className={`${styles.eventItem} ${event.id === newEventId ? styles.newEvent : ''}`} 
                  onClick={() => onEventClick(event)}
                >
                  <div className={styles.eventHeader}>
                    <div className={`${styles.categoryLabel} ${styles[columnStyle]}`}>
                      {category}
                    </div>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                  </div>
                  <div className={styles.eventMeta}>
                    <div className={styles.ageTags}>
                      {sortAgeGroups(event.age_groups).map((age, index) => (
                        <span key={`${age}-${index}`} className={styles.ageTag} data-age={age}>{age}</span>
                      ))}
                    </div>
                    <span className={styles.duration}>所要時間：{formatDuration(event.duration)}</span>
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
        ＋ イベントを追加
      </button>
    </div>
  );
};

export default MonthCard;