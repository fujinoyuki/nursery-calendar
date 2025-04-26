export * from './event'; 

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

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  month: string;
  date: string;
  duration: Duration;
  materials: string[];
  objectives: string[];
  age_groups: string[];
  media_files: MediaFile[];
  views: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  isOwner: boolean;
  profiles: Profile | null;
} 