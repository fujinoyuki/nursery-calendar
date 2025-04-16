export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  age_group: string;
  category: string;
  materials: string;
  duration: string;
  preparation: string;
  objective: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

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