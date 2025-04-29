import React from 'react';
import Image from 'next/image';
import styles from './styles.module.css';
import { Event, AgeGroup } from '../../types/event';

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

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  // イベントに画像があるかどうかを確認
  const hasImage = event.media_files && event.media_files.length > 0 && 
                  event.media_files.some(file => file.type === 'image');
  
  // 最初の画像を取得
  const imageUrl = hasImage ? 
    event.media_files.find(file => file.type === 'image')?.url : 
    null;

  return (
    <div className={styles.eventCard} onClick={() => onClick(event)}>
      {/* 1. 画像エリア */}
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <Image
            src={imageUrl}
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
          <span className={styles.duration}>所要時間：{formatDuration(event.duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 