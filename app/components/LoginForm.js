'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth.tsx';
export default function LoginForm() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const { login, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {    
    e.preventDefault();
    

  setShowError(true);
    if (userId === '' || password === '')
   {
      

      return;
    }
    try {
      await login(userId, password);
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">
            保育士イベント<br/> カレンダー
        </h1>
        
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
              height: '3rem',
              transform: 'rotate(1deg)'
            }}          />            
            {showError && userId === '' && <div style={{ color: 'red' }}>このフィールドを入力してください</div>}

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
              height: '3rem',
              width: '100%',
              transform: 'rotate(-1deg)'
            }}           />
          {showError && password === '' && <div style={{ color: 'red' }}>このフィールドを入力してください</div>}

        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%',
            height: '3rem',
            fontSize: '1.5rem',
            backgroundColor: loading ? '#cccccc' : 'var(--color-base)',
            transition: 'transform 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
        >          
          {loading ? 'ログイン中...' : 'ログイン'}      </button>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button
            onClick={() => router.push('/register')}
            style={{
              width: '100%',
              fontSize: '1.5rem',
              height: '3rem',
              backgroundColor: 'var(--color-base)',
              transition: 'transform 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}            
            >
          
             新規登録</button>
        </div>
        <div style={{ 
          marginTop: '2rem', 
          fontSize: '0.9rem', 
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          デモアカウント: ユーザーID: admin / パスワード: password
        </div>      
      </form>      
    </div>  
  );
};