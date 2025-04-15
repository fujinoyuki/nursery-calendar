export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  age_group: string;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
} 