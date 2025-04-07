import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { app } from '../firebase';

const PostsPage = () => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const db = getFirestore(app);

  const addPost = async (userId: string, text: string) => {
    try {
      await addDoc(collection(db, 'posts'), {
        userId,
        text,
      });
      setText('')
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(user){
      addPost(user.uid, text);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">新規投稿</h1>
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="postText" style={{
            display: 'block',
            fontSize: '1.25rem',
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            投稿内容
          </label>
          <textarea
            id="postText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              height: '10rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '0.5rem',
              resize: 'vertical'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            fontSize: '1.5rem',
            backgroundColor: 'var(--color-base)',
            transition: 'transform 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            height: '2.5rem'
          }}
        >
          投稿
        </button>
      </form>
    </div>
  );
};

export default PostsPage;
