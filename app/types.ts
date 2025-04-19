export type Category = '壁　面' | '制作物' | 'その他';
export type AgeGroup = '0歳児' | '1歳児' | '2歳児' | '3歳児' | '4歳児' | '5歳児';

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Category;
  month: number;
  age_groups: AgeGroup[];
  duration: string;
  materials: string[];
  objectives: string[];
  media_files?: MediaFile[];
  likes?: string[];
  view_count?: number;
  views?: number;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description: string;
  age_groups: AgeGroup[];
  category: Category;
  materials: string[];
  objectives: string[];
  month: number;
  duration: string;
  media_files: File[];
}

export type MediaFile = {
  id: string;
  name: string;
  type: string;
  url: string;
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