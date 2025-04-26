'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './EventOverlay.module.css';
import type { Event } from '../types/event';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EventOverlayProps = {
  event: Event;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '日付なし';
  return new Date(dateString).toLocaleDateString('ja-JP');
};

// 年齢グループをソートする関数を追加
const sortAgeGroups = (ages: string[]) => {
  const ageOrder = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
  return [...ages].sort((a, b) => ageOrder.indexOf(a) - ageOrder.indexOf(b));
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

export default function EventOverlay({ event, onClose, onDelete, onEdit, season = 'spring' }: EventOverlayProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // イベントの所有者かどうかを確認
  const isOwner = event.isOwner;

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(event.id);
  };

  useEffect(() => {
    const updateViewCount = async () => {
      try {
        // セッションの確認
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('セッションが存在しません');
          return;
        }

        // 閲覧数を更新
        const { error: updateError } = await supabase
          .from('events')
          .update({ 
            views: (event.views || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id);
        
        if (updateError) {
          console.error('閲覧回数の更新に失敗しました:', updateError.message);
          return;
        }
      } catch (error) {
        console.error('閲覧回数の更新中にエラーが発生しました:', error);
      }
    };

    updateViewCount();
  }, [event.id, event.views]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.content} ${styles[season]}`} 
        onClick={e => e.stopPropagation()}
        ref={overlayRef}
      >
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <div className={styles.categoryLabel} data-category={event.category}>
            {event.category}
          </div>
          <h2 className={styles.title}>{event.title}</h2>
        </div>

        <div className={styles.meta}>
          <div className={styles.ageTags}>
            {sortAgeGroups(event.age_groups).map((age: string, index: number) => (
              <span key={index} className={styles.ageTag} data-age={age}>
                {age}
              </span>
            ))}
          </div>
          <span className={styles.duration}>所要時間：{formatDuration(event.duration)}</span>
        </div>

        {/* メディアファイル（画像・動画）の表示 */}
        {event.media_files && event.media_files.length > 0 && (
          <div className={styles.mediaSection}>
            <h3 className={styles.sectionTitle}>画像・動画</h3>
            <div className={styles.mediaGallery}>
              {event.media_files.map((media, index) => (
                <div key={index} className={styles.mediaItem}>
                  {media.type === 'image' ? (
                    <img 
                      src={media.url} 
                      alt={`${event.title}の画像 ${index + 1}`} 
                      className={styles.mediaImage}
                    />
                  ) : media.type === 'video' ? (
                    <video 
                      src={media.url} 
                      controls
                      className={styles.mediaVideo}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>説明</h3>
          <p className={styles.description}>{event.description}</p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>準備物</h3>
          <ul className={styles.materials}>
            {event.materials.map((material: string, index: number) => (
              <li key={index}>{material}</li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>目的</h3>
          <ul className={styles.objectives}>
            {event.objectives.map((objective: string, index: number) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>

        <div className={styles.eventFooter}>
          <div className={styles.eventStats}>
            <span className={styles.dateInfo}>
              作成日: {formatDate(event.created_at)}
            </span>
            <span className={styles.separator}>|</span>
            <span className={styles.authorInfo}>
              投稿者: {event.profiles?.name || '不明'}
            </span>
            <span className={styles.separator}>|</span>
            <span className={styles.viewCount}>
              閲覧数: {event.views || 0}
            </span>
          </div>

          {isOwner && (
            <div className={styles.eventActions}>
              <button onClick={onEdit} className={styles.editButton}>
                編集
              </button>
              <button
                onClick={handleDelete}
                className={`${styles.deleteButton} ${isDeleting ? styles.deleting : ''}`}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 