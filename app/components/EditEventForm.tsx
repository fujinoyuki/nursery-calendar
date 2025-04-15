'use client';

import React, { useState } from 'react';
import styles from './EditEventForm.module.css';
import { Event } from '../types';

interface EditEventFormProps {
  event: Event;
  onSubmit: (id: string, title: string, description: string, date: string, age_group: string, category: string) => Promise<void>;
  onClose: () => void;
}

export default function EditEventForm({ event, onSubmit, onClose }: EditEventFormProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState(event.date);
  const [ageGroup, setAgeGroup] = useState(event.age_group);
  const [category, setCategory] = useState(event.category);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) return;

    setLoading(true);
    try {
      await onSubmit(event.id, title, description, date, ageGroup, category);
      onClose();
    } catch (error) {
      console.error('イベントの更新に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const ageGroups = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
  const categories = ['季節行事', '製作活動', '運動遊び', '音楽活動', 'お誕生日会', 'その他'];

  return (
    <div className={styles.overlay} onClick={onClose}>
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
            <label htmlFor="date">日付</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="age_group">年齢グループ</label>
            <select
              id="age_group"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            >
              {ageGroups.map(age => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">カテゴリー</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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

          <div className={styles.buttons}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              キャンセル
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 