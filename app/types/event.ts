/**
 * 時間の型定義
 */
export interface Duration {
  start: string;
  end: string;
}

/**
 * メディアファイルの型定義
 */
export interface MediaFile {
  type: 'image' | 'video';
  url: string;
}

/**
 * プロフィールの型定義
 */
export interface Profile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * イベントのカテゴリー
 */
export type Category = '壁　面' | '制作物' | 'その他';

/**
 * 対象年齢グループ
 */
export type AgeGroup = '0歳児' | '1歳児' | '2歳児' | '3歳児' | '4歳児' | '5歳児';

/**
 * イベントの基本データ型
 */
export interface EventBase {
  title: string;
  description: string;
  category: Category;
  month: string;
  date: string;
  duration: Duration;
  materials: string[];
  objectives: string[];
  age_groups: AgeGroup[];
  media_files: MediaFile[];
}

/**
 * イベントの型定義
 */
export interface Event extends EventBase {
  id: string;
  views: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  isOwner: boolean;
  profiles: Profile;
}

/**
 * イベントフォームデータの型定義
 */
export interface EventFormData extends EventBase {
  id?: string;
}

/**
 * ローカルイベントフォームデータの型定義
 */
export interface LocalEventFormData extends Omit<EventFormData, 'media_files' | 'duration' | 'date'> {
  media_files: File[];
  duration: string;
  date?: string;
}
