'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Simple authentication context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [error, setError] = useState('');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
   
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setLoading(false);
  }, []);

  // Basic authentication function
  const login = async (userId, password) => {
    setError('')

    // In a real application, you would validate against a backend
    // For this demo, we'll use a simple check
    // The credentials would typically be BASE64 encoded for Basic Auth
    const credentials = btoa(`${userId}:${password}`);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple validation (in a real app, this would be server-side)
        if (userId === 'admin' && password === 'password') {
          const user = { id: userId, auth: credentials };
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  };

  const createUser = async (userId, password) => {
    setError('')

      return new Promise((resolve, reject) => {
        setTimeout(() => {
            // シンプルな登録処理（実際はサーバーサイドで処理）
          if (userId && password) {
          console.log("ユーザー登録に成功しました。");
          router.push('/');
          resolve(true);
          } else {
            setError('ユーザー登録に失敗しました。');
            reject(false);
          }
        }, 500);
      
    });
  };


  const logout = () => {
    localStorage.removeItem('user');
   
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, createUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
