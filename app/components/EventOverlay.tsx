'use client';

import React, { useEffect, useState, useRef } from 'react';
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
          <span className={styles.duration}>所要時間：{event.duration}</span>
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