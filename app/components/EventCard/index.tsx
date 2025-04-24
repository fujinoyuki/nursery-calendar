import React from 'react';
import Image from 'next/image';
import styles from './styles.module.css';
import { Event, AgeGroup } from '../../types';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

// 年齢グループをソートする関数
const sortAgeGroups = (ages: AgeGroup[] = []) => {
  const ageOrder: AgeGroup[] = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
  return [...ages].sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));
};

// カテゴリースタイルを取得する関数
const getCategoryStyle = (category: string): string => {
  const normalizedCategory = category?.replace(/\s+/g, '').trim();
  if (['壁面', '壁　面'].includes(normalizedCategory)) {
    return styles.wallColumn;
  }
  if (['制作物', '製作', 'アート'].includes(normalizedCategory)) {
    return styles.craftColumn;
  }
  return styles.otherColumn;
};

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  return (
    <div className={styles.eventCard} onClick={() => onClick(event)}>
      {/* 1. 画像エリア */}
      <div className={styles.imageContainer}>
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            className={styles.eventImage}
            fill
            sizes="300px"
          />
        ) : (
          <div className={styles.noImage}>NO IMAGE</div>
        )}
      </div>
      
      <div className={styles.contentContainer}>
        {/* 2. タイトルとカテゴリー */}
        <div className={styles.titleRow}>
          <div className={`${styles.categoryLabel} ${getCategoryStyle(event.category)}`}>
            {event.category}
          </div>
          <h3 className={styles.title}>{event.title}</h3>
        </div>

        {/* 3. 年齢タグ */}
        <div className={styles.ageTags}>
          {sortAgeGroups(event.age_groups).map((age, index) => (
            <span 
              key={`${age}-${index}`} 
              className={styles.ageTag}
              data-age={age}
            >
              {age}
            </span>
          ))}
        </div>

        {/* 4. 月と所要時間 */}
        <div className={styles.footer}>
          <span className={styles.month}>{event.month}月</span>
          <span className={styles.duration}>所要時間：{event.duration}分</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 