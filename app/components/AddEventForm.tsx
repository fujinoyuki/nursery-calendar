'use client';

import React, { useState, useRef } from 'react';
import styles from './AddEventForm.module.css';
import { Event } from '../types';

type AddEventFormProps = {
  onSubmit: (data: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel: () => void;
  selectedMonth: number;
};

const AGE_GROUPS = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
const CATEGORIES = ['壁　面', '制作物', 'その他'] as const;
type Category = typeof CATEGORIES[number];

export default function AddEventForm({ onSubmit, onCancel, selectedMonth }: AddEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('壁　面');
  const [otherCategory, setOtherCategory] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 所要時間が有効かどうかをチェックする関数
  const isDurationValid = () => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    return hoursNum > 0 || minutesNum > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDurationValid()) {
      alert('所要時間は時間か分のどちらかを1以上に設定してください。');
      return;
    }
    const duration = `${hours || '0'}時間${minutes || '0'}分`;
    const eventData = {
      title,
      description,
      age_groups: ageGroups,
      category: category === 'その他' ? otherCategory : category,
      duration,
      materials,
      objectives,
      date: new Date().toISOString(),
      month: selectedMonth
    };
    onSubmit(eventData);
  };

  const handleAgeGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAgeGroups(prev => 
      e.target.checked 
        ? [...prev, value]
        : prev.filter(group => group !== value)
    );
  };

  const handleMaterialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 複数の区切り文字（、・　）で分割し、空白を除去
    const items = e.target.value
      .split(/[、・\s]+/)
      .filter(item => item.trim() !== '');
    setMaterials(items);
  };

  const handleObjectivesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const items = e.target.value
      .split(/[、・\s]+/)
      .filter(item => item.trim() !== '');
    setObjectives(items);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderPreview = (file: File, index: number) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);

    return (
      <div key={index} className={styles.previewItem}>
        {isImage && <img src={url} alt="プレビュー" />}
        {isVideo && <video src={url} />}
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => handleRemoveFile(index)}
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>新しいイベントを追加</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>
              タイトル
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>
              説明
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
          </div>

          <div className={styles.formGroup}>
            <p>対象年齢</p>
            <div className={styles.checkboxGroup}>
              {AGE_GROUPS.map((age) => (
                <label
                  key={age}
                  className={`${styles.checkbox} ${ageGroups.includes(age) ? styles.selected : ''}`}
                >
                  <input
                    type="checkbox"
                    value={age}
                    checked={ageGroups.includes(age)}
                    onChange={handleAgeGroupChange}
                  />
                  {age}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <p>カテゴリー</p>
            <div className={styles.radioGroup}>
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`${styles.radioLabel} ${category === cat ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    value={cat}
                    checked={category === cat}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={styles.radioInput}
                  />
                  {cat}
                </label>
              ))}
            </div>
            {category === 'その他' && (
              <label>
                その他のカテゴリー
                <input
                  type="text"
                  className={`${styles.otherInput} ${styles.visible}`}
                  value={otherCategory}
                  onChange={(e) => setOtherCategory(e.target.value)}
                  placeholder="カテゴリーを入力してください"
                  required={category === 'その他'}
                />
              </label>
            )}
          </div>

          <div className={styles.formGroup}>
            <p>所要時間</p>
            <div className={styles.timeInputGroup}>
              <label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                />
                時間
              </label>
              <label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                />
                分
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>
              準備物
              <textarea
                value={materials.join('、')}
                onChange={handleMaterialsChange}
                placeholder="例：画用紙、クレヨン、はさみ"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>
              目的
              <textarea
                value={objectives.join('、')}
                onChange={handleObjectivesChange}
                placeholder="例：創造性を育む、手先の器用さを養う、集中力を高める"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </label>
          </div>

          <div className={styles.optionalSection}>
            <h3 className={styles.optionalTitle}>画像・動画（任意）</h3>
            <div
              className={styles.uploadArea}
              onClick={() => fileInputRef.current?.click()}
            >
              <p>クリックして画像・動画をアップロード</p>
              <p>または</p>
              <p>ファイルをドラッグ＆ドロップ</p>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.uploadInput}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
              />
            </div>
            {mediaFiles.length > 0 && (
              <div className={styles.previewArea}>
                {mediaFiles.map((file, index) => renderPreview(file, index))}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
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