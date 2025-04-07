'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

const RegisterPage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const { createUser, error, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createUser(email, password);
      router.push('/calendar');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='login-container'>
      <form className='register-form' onSubmit={handleSubmit}/>
        <h1 className='login-title'>新規登録</h1>
        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-accent-1)',
              color: 'white',
              padding: '1rem',
              marginBottom: '1rem',
              border: '3px solid var(--color-text)',
            }}
          >

            {error}
        )}
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor='userName' style={{
           display: 'block', 
           fontSize: '1.25rem', 
           marginBottom: '0.5rem',
           fontWeight: 'bold'
         }}>
           ユーザー名
          </label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ width: '100%', transform: 'rotate(1deg)', height:'3rem'}}
          />
         </div>
        <div style={{ marginBottom: '1.5rem' }}>
           <label htmlFor='email' style={{
             display: 'block',
             fontSize: '1.25rem',
             marginBottom: '0.5rem',
             fontWeight: 'bold',
           }}>
             メールアドレス
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', transform: 'rotate(-1deg)', height:'3rem'}}
          />
          </div>
         <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor='userId'
            style={{
              display: 'block',
              fontSize: '1.25rem',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
           ユーザーID</label>
          <input
            type='text'
            id='userId'
            onChange={(e) => setUserId(e.target.value)}
            style={{
              width: '100%',
              height:'3rem',
              transform: 'rotate(1deg)',
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
           onChange={(e) => setPassword(e.target.value)}
            style={{
             width: '100%',
             height:'3rem',
             transform: 'rotate(-1deg)',
           }}
         /></div>
        <div style={{ 
          marginTop: '2rem', 
          fontSize: '0.9rem', 
          textAlign: 'center',
          fontStyle: 'italic'
          }}/>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            fontSize: '1.5rem',
            backgroundColor: loading ? '#cccccc' : 'var(--color-base)',
            transition: 'transform 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            height:'2.5rem',
            transform:'rotate(-1deg)'
          }}
        >新規登録
        </button>
      </form>
</div>
  );
};

export default RegisterPage;
