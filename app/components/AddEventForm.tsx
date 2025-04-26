'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AddEventForm.module.css';
import { Event, EventFormData, AgeGroup, Category, LocalEventFormData } from '../types/event';

interface AddEventFormProps {
  onSubmit: (data: LocalEventFormData) => void | Promise<void>;
  onCancel: () => void;
  selectedMonth: number;
}

const AGE_GROUPS: AgeGroup[] = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
const CATEGORIES = ['壁　面', '制作物', 'その他'] as const;

const defaultCategory: Category = '壁　面';

export default function AddEventForm({ onSubmit, onCancel, selectedMonth }: AddEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [otherCategory, setOtherCategory] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  // 所要時間が有効かどうかをチェックする関数
  const isDurationValid = () => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    return hoursNum > 0 || minutesNum > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // データの検証
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    
    // 所要時間のバリデーション
    if (!isDurationValid()) {
      alert('所要時間は時間か分のどちらかを1以上に設定してください');
      return;
    }
    
    // フォームデータの作成
    const formData: LocalEventFormData = {
      title,
      description,
      month: selectedMonth.toString(),
      category: (category === 'その他' ? otherCategory : category) as Category,
      age_groups: ageGroups,
      duration: `${hours}時間${minutes}分`,
      materials: materials,
      objectives: objectives,
      media_files: files,
      date: dateRef.current?.value
    };
    
    console.log('送信する所要時間:', formData.duration);
    onSubmit(formData);
  };

  const handleAgeGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as AgeGroup;
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
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      if (removedFile) {
        URL.revokeObjectURL(URL.createObjectURL(removedFile));
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const renderPreview = (file: File, index: number) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);

    useEffect(() => {
      return () => {
        URL.revokeObjectURL(url);
      };
    }, [url]);

    return (
      <div key={index} className={styles.previewItem}>
        {isImage && <img src={url} alt={`プレビュー ${index + 1}`} />}
        {isVideo && <video src={url} controls />}
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
                  data-age={age}
                >
                  <input
                    type="checkbox"
                    value={age}
                    checked={ageGroups.includes(age)}
                    onChange={handleAgeGroupChange}
                  />
                  <span>{age}</span>
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
                  data-category={cat}
                >
                  <input
                    type="radio"
                    value={cat}
                    checked={category === cat}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={styles.radioInput}
                    name="category"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
            {category === 'その他' && (
              <input
                type="text"
                className={`${styles.otherInput} ${styles.visible}`}
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="カテゴリーを入力してください"
                required={category === 'その他'}
              />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>
              日付
              <input
                type="date"
                ref={dateRef}
                className={styles.dateInput}
              />
            </label>
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
            <div className={styles.uploadArea}>
              <p>クリックして画像・動画をアップロード</p>
              <p>または</p>
              <p>ファイルをドラッグ＆ドロップ</p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                className={styles.fileInput}
                accept="image/*,video/*"
              />
            </div>
            {files.length > 0 && (
              <div className={styles.previewArea}>
                {files.map((file, index) => renderPreview(file, index))}
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