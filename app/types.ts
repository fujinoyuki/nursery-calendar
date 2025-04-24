export type Category = '壁　面' | '制作物' | 'その他';
export type AgeGroup = '0歳児' | '1歳児' | '2歳児' | '3歳児' | '4歳児' | '5歳児';

export type MediaFile = {
  type: string;
  url: string;
};

export type LocalMediaFile = File;

export type Event = {
  id: string;
  title: string;
  description: string;
  month: number;
  category: string;
  age_groups: AgeGroup[];
  duration: string;
  materials: string[];
  objectives: string[];
  media_files: MediaFile[];
  views: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
};

export type EventFormData = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'views'>;

export type LocalEventFormData = Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'views' | 'media_files'> & {
  media_files: LocalMediaFile[];
};

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
} 