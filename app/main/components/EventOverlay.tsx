'use client';

import React from 'react';
import styles from './EventOverlay.module.css';
import { Event } from '../../types';

interface EventOverlayProps {
  event: Event;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export default function EventOverlay({ event, onClose, onDelete, onEdit }: EventOverlayProps) {
  const handleDelete = () => {
    if (window.confirm('このイベントを削除してもよろしいですか？')) {
      onDelete(event.id);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.title}>{event.title}</h2>
        <div className={styles.date}>
          {new Date(event.date).toLocaleDateString('ja-JP')}
        </div>
        <div className={styles.meta}>
          <span className={styles.ageGroup}>{event.age_group}</span>
          <span className={styles.category}>{event.category}</span>
        </div>
        <div className={styles.description}>{event.description}</div>
        <div className={styles.actions}>
          <button className={styles.editButton} onClick={onEdit}>
            編集
          </button>
          <button className={styles.deleteButton} onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
