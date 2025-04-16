'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signUp, error: authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, name);
      }

      if (result.error) {
        setFormError(result.error.message);
      } else {
        router.push('/main');
      }
    } catch (err: any) {
      setFormError(err.message || '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const displayError = formError || (authError && authError.message);

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.formTitle}>
        {isLogin ? 'ログイン' : '新規登録'}
      </h2>
      
      {displayError && (
        <div className={styles.errorMessage}>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              名前
            </label>
            <input
              id="name"
              type="text"
              required
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            required
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            パスワード
          </label>
          <input
            id="password"
            type="password"
            required
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.button}
        >
          <span className={styles.buttonText}>
            {loading ? '処理中...' : isLogin ? 'ログイン' : '登録'}
          </span>
        </button>
      </form>

      <div
        className={styles.switchText}
        onClick={() => {
          setIsLogin(!isLogin);
          setFormError(null);
        }}
      >
        {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
      </div>
    </div>
  );
} 