'use client';

import React, { useState } from 'react';
import styles from './AddEventForm.module.css';
import { Event } from '../types';

type EventFormData = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

interface AddEventFormProps {
  onSubmit: (eventData: EventFormData) => void;
  onCancel: () => void;
}

export default function AddEventForm({ onSubmit, onCancel }: AddEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [age_group, setAgeGroup] = useState('');
  const [category, setCategory] = useState('');
  const [materials, setMaterials] = useState('');
  const [duration, setDuration] = useState('');
  const [preparation, setPreparation] = useState('');
  const [objective, setObjective] = useState('');

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
      date: new Date().toISOString(),
    });
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>新しいイベントを追加</h2>
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
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 