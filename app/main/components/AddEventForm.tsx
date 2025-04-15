import React, { useState } from 'react';
import styles from './AddEventForm.module.css';

interface AddEventFormProps {
  month: number;
  onSubmit: (title: string, description: string, date: string) => Promise<void>;
  onClose: () => void;
}

const getSeason = (month: number): string => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

export default function AddEventForm({ month, onSubmit, onClose }: AddEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    
    if (!description.trim()) {
      setError('詳細を入力してください');
      return;
    }
    
    if (!date.trim()) {
      setError('日付を入力してください');
      return;
    }
    
    await onSubmit(title, description, date);
    setTitle('');
    setDescription('');
    setDate('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.formContainer} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.formTitle}>{month}月のイベントを追加</h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>タイトル</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="イベント名を入力"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="date" className={styles.label}>日付</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>説明</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="イベントの詳細を入力"
              rows={6}
              required
            />
          </div>
          
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
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
