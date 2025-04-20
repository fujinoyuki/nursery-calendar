'use client';

import React, { useEffect } from 'react';
import styles from './EventOverlay.module.css';
import { Event } from '../types';
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

export default function EventOverlay({ event, onClose, onDelete, onEdit, season = 'spring' }: EventOverlayProps) {
  useEffect(() => {
    const updateViewCount = async () => {
      try {
        // セッションの確認
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 閲覧数を更新（user_idチェックを削除）
        const { data, error } = await supabase
          .from('events')
          .update({ 
            views: (event.views || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', event.id)
          .select();
        
        if (error) {
          console.error('閲覧回数の更新に失敗しました:', error);
          return;
        }

        // イベントの更新をトリガー
        if (data) {
          const channel = supabase
            .channel('events_changes')
            .on('postgres_changes', 
              { 
                event: 'UPDATE',
                schema: 'public',
                table: 'events',
                filter: `id=eq.${event.id}`
              },
              (payload) => {
                console.log('イベント更新:', payload);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (error) {
        console.error('Error updating view count:', error);
      }
    };

    updateViewCount();
  }, [event.id]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.content} ${styles[season]}`} 
        onClick={e => e.stopPropagation()}
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
          <span className={styles.duration}>{event.duration}</span>
        </div>

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

        <div className={styles.eventStats}>
          <span className={styles.viewCount}>
            閲覧数: {event.views || 0}
          </span>
          <span className={styles.dateInfo}>
            作成日: {formatDate(event.created_at)}
          </span>
        </div>

        <div className={styles.actions}>
          <button onClick={onEdit} className={styles.editButton}>
            編集
          </button>
          <button onClick={() => onDelete(event.id)} className={styles.deleteButton}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
} 