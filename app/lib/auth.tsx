'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }
        
        if (session?.user) {
          console.log('Session found:', session.user);
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name
          });
        } else {
          console.log('No session found');
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setError(null);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        const authError: AuthError = {
          message: signInError.message,
          code: signInError.status?.toString()
        };
        setError(authError);
        return { error: authError };
      }
      
      if (data?.user) {
        console.log('Sign in successful:', data.user);
        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
        };
        setUser(userData);
        return {};
      } else {
        console.error('No user data received after sign in');
        return { error: { message: 'ユーザーデータが取得できませんでした' } };
      }
    } catch (err: any) {
      console.error('Unexpected sign in error:', err);
      const authError: AuthError = {
        message: err.message || 'ログインに失敗しました',
        code: err.code
      };
      setError(authError);
      return { error: authError };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (signUpError) {
        const authError: AuthError = {
          message: signUpError.message,
          code: signUpError.status?.toString()
        };
        setError(authError);
        return { error: authError };
      }

      return {};
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || '登録に失敗しました',
        code: err.code
      };
      setError(authError);
      return { error: authError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 