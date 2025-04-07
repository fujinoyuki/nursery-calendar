'use client'

import { useRouter } from 'next/navigation';
import { getPosts } from './lib/data';

const HomePage = () => {
  const router = useRouter();
  const posts = getPosts();

  return (
    <div className="login-container">
       <button
          onClick={() => router.push('/posts')}
          style={{ 
            width: '100%',
            fontSize: '1.5rem',
            backgroundColor:  'var(--color-base)',
            transition: 'transform 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            height:'2.5rem',
            marginBottom:'2rem'
            }}
        >
          新規投稿
        </button>
        <h1 className="login-title">アイデア集</h1>
        {posts && (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <h1>{post.title}</h1>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
};
export default HomePage;