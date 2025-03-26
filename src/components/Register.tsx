import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("ユーザーが正常に作成されました");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div>
      <h2>新規登録</h2>
      <form onSubmit={register}>
        <div>
          <label htmlFor="email">メールアドレス</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">パスワード</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">登録</button>
      </form>
      {errorMessage && <div className="error">{errorMessage}</div>}
    </div>
  );
};

export default Register;