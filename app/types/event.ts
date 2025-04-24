export type MediaFile = {
  id: string;
  url: string;
  type: string;
};

export type Duration = string;

export type Category = '壁　面' | '制作物' | 'その他';

export type AgeGroup = '0歳児' | '1歳児' | '2歳児' | '3歳児' | '4歳児' | '5歳児';

export type EventCategory = 
  | '製作'
  | '運動'
  | '音楽'
  | '感触遊び'
  | '描画'
  | 'その他';

export type Media = {
  id: string;
  url: string;
  type: 'image' | 'video';
};

export type Event = {
  id: string;
  title: string;
  description: string;
  month: string;
  duration: string;
  age_groups: AgeGroup[];
  category: Category;
  materials: string[];
  objectives: string[];
  media_files?: MediaFile[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  views?: number;
};

export type EventFormData = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'views' | 'media_files'> & {
  media_files: File[];
};

export type LocalEventFormData = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'views' | 'media_files'> & {
  media_files: File[];
}; 