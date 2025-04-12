"use client";

import React, { useState } from 'react'; // useEffect を削除
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  // Test user registration - 削除
  // useEffect(() => {
  //   const createTestUser = async () => {
  //     try {
  //       // Check if user exists first
  //       const { data: existingUser, error: userError } = await supabase
  //         .from('auth.users')
  //         .select('*')
  //         .eq('email', 'test@example.com')

  //       if (userError) {
  //         console.error('Error checking for existing user:', userError);
  //         return;
  //       }

  //       if (existingUser && existingUser.length > 0) {
  //         console.log('Test user already exists.');
  //         return; // Don't create if already exists
  //       }

  //       const { data, error } = await supabase.auth.signUp({
  //         email: 'test@example.com',
  //         password: 'test1234',
  //       });
  //       if (error) {
  //         console.error('Test user registration error', error);
  //       } else {
  //         console.log('Test user registration successful', data);
  //       }
  //     } catch (error) {
  //       console.error('Error during test user registration', error);
  //     }
  //   };
  //   createTestUser();
  // }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        console.error('Login error:', error);
        return;
      }

      console.log("Login successful:", data);
      // router.push('/items'); // ★一旦コメントアウトしてMiddlewareに任せるか確認
      // 代わりに強制リロードでMiddlewareをトリガーさせる
      window.location.href = '/items';

    } catch (error: any) {
      setErrorMessage('An unexpected error occurred.');
      console.error('Unexpected login error:', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {errorMessage && <div className="error" style={{ color: 'red' }}>{errorMessage}</div>}
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ border: '3px solid black', padding: '5px', fontFamily: 'Courier New' }}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ border: '3px solid black', padding: '5px', fontFamily: 'Courier New' }}
          />
        </div>
        <button type="submit" style={{ border: '3px solid black', padding: '10px', fontFamily: 'Courier New', fontWeight: 'bold', marginTop: '10px' }}>Login</button>
      </form>
       <p style={{ marginTop: '20px' }}>Don't have an account? <a href="/register">Register</a></p>
       {/* Test User Information */}       <div style={{ marginTop: '20px', border: '1px solid black', padding: '10px' }}>         <h3>Test Login</h3>         <p><strong>Email:</strong> test@example.com</p>         <p><strong>Password:</strong> test1234</p>       </div>     </div>
  );
}