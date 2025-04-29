'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import styles from './EditEventForm.module.css';
import type { Event, LocalEventFormData, MediaFile, Category, AgeGroup, EventFormData, Duration } from '../types/event';
import { createBrowserClient } from '@supabase/ssr';

export const CATEGORIES = ['壁　面', '制作物', 'その他'] as const;
export const AGE_GROUPS = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'] as const;
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

// EventFormDataを拡張して実際のファイルを含むことができるようにします
type EditFormData = Omit<EventFormData, 'media_files'> & {
  media_files: (MediaFile | File)[];
};

interface Props {
  data: Omit<Event, 'id' | 'views' | 'created_at' | 'updated_at' | 'user_id' | 'isOwner' | 'profiles'> & {
    media_files?: MediaFile[];
  };
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
    media_files: data.media_files || []
  });
  
  const [otherCategory, setOtherCategory] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});
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

  // 初期メディアファイルを設定
  useEffect(() => {
    if (data.media_files && data.media_files.length > 0) {
      console.log('初期メディアファイル:', data.media_files);
      setFormData(prev => ({
        ...prev,
        media_files: data.media_files || []
      }));
      
      // メディアファイルのBlobURLを生成
      loadMediaFiles();
    }
  }, [data.media_files]);
  
  // メディアファイルのBlobURLを生成する関数
  const loadMediaFiles = async () => {
    if (!data.media_files || data.media_files.length === 0) return;
    
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('セッションエラー:', sessionError);
        return;
      }
      
      if (!session) {
        console.log('セッションがありません');
        return;
      }

      const newBlobUrls: Record<string, string> = { ...imageBlobUrls };
      let updated = false;

      // 各メディアファイルを処理
      for (let i = 0; i < data.media_files.length; i++) {
        const media = data.media_files[i];
        
        // 画像のみ処理
        if (media.type === 'image') {
          try {
            // URLからファイルパスを抽出する
            const urlObj = new URL(media.url);
            const pathSegments = urlObj.pathname.split('/');
            // "public"と"event-media"の後の部分を取得
            const bucketPath = pathSegments.slice(pathSegments.indexOf('event-media') + 1).join('/');
            
            if (!bucketPath) {
              console.error(`メディア[${i}]の画像パスが不正です:`, media.url);
              continue;
            }
            
            // 直接バケットからデータを取得
            const { data: fileData, error } = await supabase
              .storage
              .from('event-media')
              .download(bucketPath);
            
            if (error) {
              console.error(`メディア[${i}]の画像ダウンロードエラー:`, error);
              
              // 直接URLを使用してみる（フォールバック）
              try {
                const response = await fetch(media.url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                newBlobUrls[`media_${i}`] = blobUrl;
                updated = true;
                console.log(`メディア[${i}]の画像を直接URLから取得しました`);
              } catch (fetchError) {
                console.error(`メディア[${i}]の直接URL取得エラー:`, fetchError);
              }
              continue;
            }
            
            if (!fileData) {
              console.error(`メディア[${i}]の画像データが空です`);
              continue;
            }
            
            // Blobを作成してURLを生成
            const blob = new Blob([fileData], { type: 'image/png' });
            const blobUrl = URL.createObjectURL(blob);
            newBlobUrls[`media_${i}`] = blobUrl;
            updated = true;
            console.log(`メディア[${i}]の画像BlobURL作成成功:`, blobUrl);
          } catch (error) {
            console.error(`メディア[${i}]の画像処理エラー:`, error);
          }
        }
      }

      if (updated) {
        setImageBlobUrls(newBlobUrls);
      }
    } catch (error) {
      console.error('メディアファイル読み込み中のエラー:', error);
    }
  };

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
        return file; // ファイルをそのまま保持
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
    console.log('Rendering preview for file:', file, 'index:', index);
    
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
    console.log('MediaFile type:', (file as MediaFile).type, 'url:', (file as MediaFile).url);
    
    // BlobURLが生成されている場合はそれを使用
    const blobUrl = imageBlobUrls[`media_${index}`];
    
    return (
      <div key={index} className={styles.previewItem}>
        {(file as MediaFile).type === 'image' && (
          blobUrl ? (
            <img 
              src={blobUrl} 
              alt={`プレビュー ${index + 1}`}
              onError={(e) => {
                console.error(`画像読み込みエラー (BlobURL):`, blobUrl);
                e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22150%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23f0f0f0%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2214%22%20x%3D%2240%22%20y%3D%2275%22%3E画像なし%3C%2Ftext%3E%3C%2Fsvg%3E';
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              color: '#999'
            }}>
              読み込み中...
            </div>
          )
        )}
        {(file as MediaFile).type === 'video' && (
          <video 
            src={(file as MediaFile).url} 
            controls
            onError={(e) => {
              console.error(`動画読み込みエラー (プレビュー):`, (file as MediaFile).url);
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const errorDiv = document.createElement('div');
                errorDiv.style.width = '100%';
                errorDiv.style.height = '100%';
                errorDiv.style.display = 'flex';
                errorDiv.style.alignItems = 'center';
                errorDiv.style.justifyContent = 'center';
                errorDiv.style.background = '#f0f0f0';
                errorDiv.style.color = '#999';
                errorDiv.textContent = '動画なし';
                parent.appendChild(errorDiv);
              }
            }}
          />
        )}
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