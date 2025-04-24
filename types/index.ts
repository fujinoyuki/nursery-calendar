export type Category = 
  | '製作'
  | '運動'
  | '音楽'
  | '言語'
  | '生活'
  | '食育'
  | '園外'
  | 'その他';

export type AgeGroup = '0歳児' | '1歳児' | '2歳児' | '3歳児' | '4歳児' | '5歳児';

export interface Event {
  id: string;
  title: string;
  description: string;
  age_groups: AgeGroup[];
  category: Category;
  duration: {
    hours: number;
    minutes: number;
  };
  materials: string[];
  objectives: string[];
  media_files: {
    url: string;
    type: 'image' | 'video';
  }[];
  created_at: string;
  month: number;
} 