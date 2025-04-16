'use client';

import React, { useState, useRef } from 'react';
import styles from './EditEventForm.module.css';
import { Event } from '../types';

type EditEventFormProps = {
  event: Event;
  onSubmit: (data: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel: () => void;
};

const AGE_GROUPS = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
const CATEGORIES = ['壁　面', '制作物', 'その他'] as const;
type Category = typeof CATEGORIES[number];

export default function EditEventForm({ event, onSubmit, onCancel }: EditEventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: event.title,
    description: event.description,
    age_groups: event.age_groups,
    category: event.category as Category,
    duration: event.duration,
    materials: event.materials,
    objectives: event.objectives,
    month: event.month
  });
  const [otherCategory, setOtherCategory] = useState(
    CATEGORIES.includes(event.category) ? '' : event.category
  );
  const initialDuration = event.duration.match(/(\d+)時間(\d+)分/);
  const [hours, setHours] = useState(initialDuration ? initialDuration[1] : '0');
  const [minutes, setMinutes] = useState(initialDuration ? initialDuration[2] : '0');
  const [mediaFiles, setMediaFiles] = useState<File[]>(event.media_files || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDurationValid = () => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    return hoursNum > 0 || minutesNum > 0;
  };

  const handleAgeGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      age_groups: e.target.checked
        ? [...prev.age_groups, value]
        : prev.age_groups.filter(group => group !== value)
    }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDurationValid()) {
      alert('所要時間は時間か分のどちらかを1以上に設定してください。');
      return;
    }
    const duration = `${hours || '0'}時間${minutes || '0'}分`;
    onSubmit({
      title: formData.title,
      description: formData.description,
      age_groups: formData.age_groups,
      category: formData.category === 'その他' ? otherCategory : formData.category,
      duration,
      materials: formData.materials,
      objectives: formData.objectives,
      date: event.date,
      month: formData.month,
      media_files: mediaFiles
    });
  };

  const handleMaterialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      materials: e.target.value.split('\n').filter(item => item.trim() !== '')
    }));
  };

  const handleObjectivesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      objectives: e.target.value.split('\n').filter(item => item.trim() !== '')
    }));
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
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">説明</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>対象年齢</label>
            <div className={styles.checkboxGroup}>
              {AGE_GROUPS.map((age) => (
                <label
                  key={age}
                  className={`${styles.checkbox} ${formData.age_groups.includes(age) ? styles.selected : ''}`}
                  data-age={age}
                >
                  <input
                    type="checkbox"
                    value={age}
                    checked={formData.age_groups.includes(age)}
                    onChange={handleAgeGroupChange}
                  />
                  {age}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>カテゴリー</label>
            <div className={styles.radioGroup}>
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`${styles.radioLabel} ${formData.category === cat ? styles.selected : ''}`}
                  data-category={cat}
                >
                  <input
                    type="radio"
                    value={cat}
                    checked={formData.category === cat}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                    className={styles.radioInput}
                  />
                  {cat}
                </label>
              ))}
            </div>
            {formData.category === 'その他' && (
              <input
                type="text"
                className={`${styles.otherInput} ${styles.visible}`}
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="カテゴリーを入力してください"
                required={formData.category === 'その他'}
              />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>所要時間</label>
            <div className={styles.timeInputGroup}>
              <input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
              />
              <span>時間</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
              />
              <span>分</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="materials">準備物（1行に1つ）</label>
            <textarea
              id="materials"
              value={formData.materials.join('\n')}
              onChange={handleMaterialsChange}
              placeholder="例：画用紙&#13;&#10;クレヨン&#13;&#10;はさみ"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="objectives">目的（1行に1つ）</label>
            <textarea
              id="objectives"
              value={formData.objectives.join('\n')}
              onChange={handleObjectivesChange}
              placeholder="例：創造性を育む&#13;&#10;手先の器用さを養う&#13;&#10;集中力を高める"
            />
          </div>

          <div className={styles.optionalSection}>
            <h3 className={styles.optionalTitle}>画像・動画</h3>
            <div
              className={styles.uploadArea}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className={styles.uploadInput}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
              />
              <p>クリックして画像・動画を追加</p>
              <p>または</p>
              <p>ファイルをドラッグ＆ドロップ</p>
            </div>

            {mediaFiles.length > 0 && (
              <div className={styles.previewArea}>
                {mediaFiles.map((file, index) => (
                  <div key={index} className={styles.previewItem}>
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt={`プレビュー ${index + 1}`} />
                    ) : (
                      <video src={URL.createObjectURL(file)} controls />
                    )}
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemoveFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
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