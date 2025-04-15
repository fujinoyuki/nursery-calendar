'use client';

import React, { useState } from 'react';
import styles from './EditEventForm.module.css';
import { Event } from '../types';

type EventFormData = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

interface EditEventFormProps {
  event: Event;
  onSubmit: (eventData: EventFormData) => void;
  onCancel: () => void;
}

export default function EditEventForm({ event, onSubmit, onCancel }: EditEventFormProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [age_group, setAgeGroup] = useState(event.age_group);
  const [category, setCategory] = useState(event.category);
  const [materials, setMaterials] = useState(event.materials || '');
  const [duration, setDuration] = useState(event.duration || '');
  const [preparation, setPreparation] = useState(event.preparation || '');
  const [objective, setObjective] = useState(event.objective || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      age_group,
      category,
      materials,
      duration,
      preparation,
      objective,
      date: event.date,
    });
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>イベントを編集</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">タイトル</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">説明</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="age_group">年齢</label>
            <input
              type="text"
              id="age_group"
              value={age_group}
              onChange={(e) => setAgeGroup(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">カテゴリー</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="materials">材料</label>
            <textarea
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration">所要時間</label>
            <input
              type="text"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="preparation">準備</label>
            <textarea
              id="preparation"
              value={preparation}
              onChange={(e) => setPreparation(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="objective">目的</label>
            <textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              required
            />
          </div>

          <div className={styles.buttons}>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              キャンセル
            </button>
            <button type="submit" className={styles.submitButton}>
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 