'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('ログイン処理開始');

    if (!userId || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      console.log('認証開始:', { userId });
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: userId,
        password: password,
      });
      console.log('認証結果:', { data, error: authError });

      if (authError) {
        console.error('認証エラー:', authError);
        setError('ログインに失敗しました。メールアドレスまたはパスワードが間違っています。');
        return;
      }

      if (data.user) {
        console.log('ログイン成功、セッション確立待機');
        
        // セッションの確立を確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('セッション確認エラー:', sessionError);
          setError('セッションの確立に失敗しました。');
          return;
        }

        console.log('セッション確立完了、メインページへリダイレクト');
        // 強制的なページ遷移を使用
        window.location.href = '/main';
      } else {
        console.log('ユーザーデータなし');
        setError('ログインに失敗しました。');
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('ログイン中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.loginTitle}>ログイン</h1>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="userId">メールアドレス</label>
            <input
              type="email"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={styles.inputField}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputField}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>
          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading ? '処理中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
