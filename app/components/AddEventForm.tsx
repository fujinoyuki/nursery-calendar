'use client';

import React, { useState } from 'react';
import styles from './AddEventForm.module.css';

interface AddEventFormProps {
  month: number;
  onSubmit: (title: string, description: string, date: string) => Promise<void>;
  onClose: () => void;
}

export default function AddEventForm({ month, onSubmit, onClose }: AddEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [ageGroup, setAgeGroup] = useState('0歳児');
  const [category, setCategory] = useState('季節行事');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) return;

    setLoading(true);
    try {
      await onSubmit(title, description, date);
      onClose();
    } catch (error) {
      console.error('イベントの追加に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const ageGroups = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
  const categories = ['季節行事', '製作活動', '運動遊び', '音楽活動', 'お誕生日会', 'その他'];

  return (
    <div className={styles.overlay} onClick={onClose}>
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
              {loading ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 