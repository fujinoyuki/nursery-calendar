'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import styles from './EditEventForm.module.css';
import type { Event, LocalEventFormData, MediaFile, Category, AgeGroup, EventFormData, Duration } from '../types/event';

export const CATEGORIES = ['壁　面', '制作物', 'その他'] as const;
export const AGE_GROUPS = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'] as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

// EventFormDataを拡張して実際のファイルを含むことができるようにします
type EditFormData = Omit<EventFormData, 'media_files'> & {
  media_files: (MediaFile | File)[];
};

interface Props {
  data: Omit<Event, 'id' | 'views' | 'created_at' | 'updated_at' | 'user_id' | 'isOwner' | 'profiles'>;
  onSubmit: (data: EditFormData) => Promise<void>;
  onCancel: () => void;
}

export default function EditEventForm({ data, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<EditFormData>({
    title: data.title,
    description: data.description,
    month: data.month,
    date: data.date,
    duration: data.duration,
    age_groups: data.age_groups,
    category: data.category,
    materials: data.materials,
    objectives: data.objectives,
    media_files: []
  });
  
  const [otherCategory, setOtherCategory] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // コンポーネントが初期化されるときにdurationから時間と分を抽出
  useEffect(() => {
    if (data.duration) {
      // オブジェクト形式の場合
      if (typeof data.duration === 'object' && data.duration.end) {
        const timeMatch = data.duration.end.match(/^(\d{1,2}):(\d{1,2})$/);
        if (timeMatch) {
          setHours(timeMatch[1]);
          setMinutes(timeMatch[2]);
        }
      } 
      // 文字列形式の場合（例: "2時間30分"）
      else if (typeof data.duration === 'string') {
        const durationStr = data.duration as string;
        const hoursMatch = durationStr.match(/(\d+)時間/);
        const minutesMatch = durationStr.match(/(\d+)分/);
        
        if (hoursMatch) setHours(hoursMatch[1]);
        if (minutesMatch) setMinutes(minutesMatch[1]);
      }
    }
  }, [data.duration]);

  const isDurationValid = () => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    return hoursNum > 0 || minutesNum > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDurationValid()) {
      alert('所要時間を入力してください');
      return;
    }
    
    // 所要時間を文字列形式で保存（"X時間Y分"形式）
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    let durationStr = '';
    
    if (hoursNum > 0) {
      durationStr += `${hoursNum}時間`;
    }
    
    if (minutesNum > 0) {
      durationStr += `${minutesNum}分`;
    }
    
    const finalCategory = formData.category === 'その他' ? otherCategory : formData.category;
    const formDataToSubmit: EditFormData = {
      ...formData,
      duration: {
        start: "00:00",
        end: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
      },
      category: finalCategory as Category,
      media_files: formData.media_files
    };
    await onSubmit(formDataToSubmit);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: EditFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgeGroupChange = (group: AgeGroup) => {
    setFormData((prev: EditFormData) => {
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
    setFormData((prev: EditFormData) => ({
      ...prev,
      category
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newMediaFiles = newFiles.map(file => {
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        return {
          type: type as 'image' | 'video',
          url: URL.createObjectURL(file),
          file: file // 元のFileオブジェクトを保持
        };
      });
      
      setFormData(prev => ({
        ...prev,
        media_files: [...prev.media_files, ...newMediaFiles]
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => {
      const newMediaFiles = [...prev.media_files];
      newMediaFiles.splice(index, 1);
      return {
        ...prev,
        media_files: newMediaFiles
      };
    });
  };

  const renderPreview = (file: MediaFile | File, index: number) => {
    // Fileオブジェクトの場合はURL.createObjectURLを使用
    if (file instanceof File) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);

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
    }

    // MediaFileオブジェクトの場合
    return (
      <div key={index} className={styles.previewItem}>
        {file.type === 'image' && <img src={file.url} alt={`プレビュー ${index + 1}`} />}
        {file.type === 'video' && <video src={file.url} controls />}
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

  const handleArrayFieldChange = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof Pick<Event, 'materials' | 'objectives'>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        setFormData((prev: EditFormData) => ({
          ...prev,
          [field]: [...prev[field], value],
        }));
        e.currentTarget.value = '';
      }
    }
  };

  const removeArrayItem = (field: keyof Pick<Event, 'materials' | 'objectives'>, index: number) => {
    setFormData((prev: EditFormData) => ({
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
    setFormData((prev: EditFormData) => ({
      ...prev,
      materials: [...prev.materials, '']
    }));
  };

  const addObjective = () => {
    setFormData((prev: EditFormData) => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData((prev: EditFormData) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const removeObjective = (index: number) => {
    setFormData((prev: EditFormData) => ({
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
            <label>
              月
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                required
                className={styles.select}
              >
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>
              タイトル
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={`${styles.input} ${styles.fullWidth}`}
              />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>
              説明
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className={`${styles.textarea} ${styles.fullWidth}`}
              />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="materials">準備物（・ や 、 で区切って入力）</label>
            <textarea
              id="materials"
              name="materials"
              value={formData.materials.join('、')}
              onChange={(e) => {
                const items = e.target.value
                  .split(/[、・]/)
                  .map(item => item.trim())
                  .filter(item => item !== '');
                setFormData(prev => ({
                  ...prev,
                  materials: items
                }));
              }}
              placeholder="例：&#13;&#10;画用紙、クレヨン、はさみ"
              className={`${styles.textarea} ${styles.fullWidth}`}
              rows={5}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="objectives">目的（・ や 、 で区切って入力）</label>
            <textarea
              id="objectives"
              name="objectives"
              value={formData.objectives.join('、')}
              onChange={(e) => {
                const items = e.target.value
                  .split(/[、・]/)
                  .map(item => item.trim())
                  .filter(item => item !== '');
                setFormData(prev => ({
                  ...prev,
                  objectives: items
                }));
              }}
              placeholder="例：&#13;&#10;創造性を育む、手先の器用さを養う、集中力を高める"
              className={`${styles.textarea} ${styles.fullWidth}`}
              rows={5}
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
                    checked={formData.age_groups.includes(age)}
                    onChange={() => handleAgeGroupChange(age)}
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
                    name="category"
                    value={cat}
                    checked={formData.category === cat}
                    onChange={(e) => handleCategoryChange(e.target.value as Category)}
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
                className={styles.timeInput}
              />
              <span>時間</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                className={styles.timeInput}
              />
              <span>分</span>
            </div>
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
            </div>

            {formData.media_files.length > 0 && (
              <div className={styles.previewArea}>
                {formData.media_files.map((file, index) => renderPreview(file, index))}
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