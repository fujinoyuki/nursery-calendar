'use client'
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(userId, password);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">ログイン</h1>
        {error && (
          <div style={{ 
            backgroundColor: 'var(--color-accent-1)', 
            color: 'white', 
            padding: '1rem', 
            marginBottom: '1rem',
            border: '3px solid var(--color-text)'
          }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="userId" style={{ 
            display: 'block', 
            fontSize: '1.25rem', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            ユーザーID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ 
              width: '100%',
              transform: 'rotate(1deg)',
              height:'3rem',
            }}
          />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="password" style={{ 
            display: 'block', 
            fontSize: '1.25rem', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%',
              transform: 'rotate(-1deg)',
              height:'3rem',
            }}
          />
        </div>
        
        <button 
          type="submit" 
          style={{ 
            width: '100%',
            fontSize: '1.5rem',
            backgroundColor:  'var(--color-base)',
            transition: 'transform 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            height:'2.5rem'
          }}
          disabled={loading}
        >
          ログイン
        </button>
      </form>
    </div>
  );
};

export default LoginPage;