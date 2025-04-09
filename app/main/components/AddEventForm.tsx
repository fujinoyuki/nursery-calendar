import React, { useState } from 'react';
import styles from './AddEventForm.module.css';

interface AddEventFormProps {
  onSubmit: (title: string, description: string) => void;
  onCancel: () => void;
  month: string;
}

const AddEventForm: React.FC<AddEventFormProps> = ({ onSubmit, onCancel, month }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
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
    
    onSubmit(title, description);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.formContainer} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.formTitle}>{month}のイベント追加</h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>イベント名</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="イベント名を入力"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>イベント詳細</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="イベントの詳細を入力"
              rows={6}
            />
          </div>
          
          <div className={styles.formActions}>
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
};

export default AddEventForm;
