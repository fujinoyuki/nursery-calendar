'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import styles from './EditEventForm.module.css';
import type { Event, EventFormData, MediaFile, Category, AgeGroup } from '../types';

const CATEGORIES: Category[] = ['壁　面', '制作物', 'その他'];
const AGE_GROUPS: AgeGroup[] = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];

interface Props {
  data: EventFormData;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
}

export default function EditEventForm({ data, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<EventFormData>(data);
  const [otherCategory, setOtherCategory] = useState<string>(
    CATEGORIES.includes(data.category as Category) ? '' : data.category
  );
  const initialDuration = data.duration.match(/(\d+)時間(\d+)分/);
  const [hours, setHours] = useState(initialDuration ? initialDuration[1] : '0');
  const [minutes, setMinutes] = useState(initialDuration ? initialDuration[2] : '0');
  const [mediaFiles, setMediaFiles] = useState<File[]>(data.media_files || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDurationValid = () => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    return hoursNum > 0 || minutesNum > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: EventFormData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category === 'その他' ? otherCategory.trim() as Category : formData.category,
      age_groups: formData.age_groups,
      duration: `${hours}時間${minutes}分`,
      materials: formData.materials.filter(m => m.trim()),
      objectives: formData.objectives.filter(o => o.trim()),
      month: formData.month,
      media_files: mediaFiles
    };
    onSubmit(submitData);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: EventFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgeGroupChange = (group: AgeGroup) => {
    setFormData((prev: EventFormData) => {
      const newAgeGroups = prev.age_groups.includes(group)
        ? prev.age_groups.filter(g => g !== group)
        : [...prev.age_groups, group];
      return {
        ...prev,
        age_groups: newAgeGroups
      };
    });
  };

  const handleCategoryChange = (category: Category) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      category
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const newFiles = Array.from(e.target.files).filter(file => {
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name}は対応していないファイル形式です。JPG、PNG、GIF形式のみ対応しています。`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}のファイルサイズが大きすぎます。5MB以下のファイルを選択してください。`);
          return false;
        }
        return true;
      });
      setMediaFiles((prev: File[]) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles(prev => {
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

  const handleArrayFieldChange = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof Pick<EventFormData, 'materials' | 'objectives'>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        setFormData((prev: EventFormData) => ({
          ...prev,
          [field]: [...prev[field], value],
        }));
        e.currentTarget.value = '';
      }
    }
  };

  const removeArrayItem = (field: keyof Pick<EventFormData, 'materials' | 'objectives'>, index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const items = e.target.value
      .split(/\n/)
      .map(item => item.trim())
      .filter(item => item !== '');
    setFormData(prev => ({
      ...prev,
      materials: items
    }));
  };

  const handleObjectiveChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const items = e.target.value
      .split(/\n/)
      .map(item => item.trim())
      .filter(item => item !== '');
    setFormData(prev => ({
      ...prev,
      objectives: items
    }));
  };

  const addMaterial = () => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      materials: [...prev.materials, '']
    }));
  };

  const addObjective = () => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const removeObjective = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
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
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">説明</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>対象年齢</label>
            <div className={styles.checkboxGroup}>
              {AGE_GROUPS.map((age) => (
                <label
                  key={age}
                  className={`${styles.checkbox} ${formData.age_groups.includes(age as AgeGroup) ? styles.selected : ''}`}
                  data-age={age}
                >
                  <input
                    type="checkbox"
                    value={age}
                    checked={formData.age_groups.includes(age as AgeGroup)}
                    onChange={(e) => handleAgeGroupChange(e.target.value as AgeGroup)}
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
                    onChange={(e) => handleCategoryChange(e.target.value as Category)}
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
              name="materials"
              value={formData.materials.join('\n')}
              onChange={handleMaterialChange}
              placeholder="例：&#13;&#10;画用紙&#13;&#10;クレヨン&#13;&#10;はさみ"
              rows={5}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="objectives">目的（1行に1つ）</label>
            <textarea
              id="objectives"
              name="objectives"
              value={formData.objectives.join('\n')}
              onChange={handleObjectiveChange}
              placeholder="例：&#13;&#10;創造性を育む&#13;&#10;手先の器用さを養う&#13;&#10;集中力を高める"
              rows={5}
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
                {mediaFiles.map((file, index) => renderPreview(file, index))}
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