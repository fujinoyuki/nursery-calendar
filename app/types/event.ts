export interface Duration {
  start: string;
  end: string;
}

export interface MediaFile {
  type: string;
  url: string;
}

export interface Profile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

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

export interface Event {
  id: string;
  title: string;
  description: string;
  category: Category;
  month: string;
  date: string;
  duration: string;
  materials: string[];
  objectives: string[];
  age_groups: AgeGroup[];
  media_files: MediaFile[];
  views: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  isOwner: boolean;
  profiles: Profile | null;
}

export type EventFormData = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'views' | 'media_files' | 'isOwner' | 'profiles'> & {
  media_files: File[];
};

export type LocalEventFormData = EventFormData; 