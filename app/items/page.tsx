// 'use client'; // Server Componentとして動作させるためコメントアウト

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Server Component用クライアント
import { cookies } from 'next/headers';
// import { eventData, introduction } from "@/lib/data"; // ハードコードされたデータは削除
import { Item } from "@/models/Item"; // Item型は使用
import Link from 'next/link'; // 投稿ページへのリンク用

// データの取得を非同期関数で行う
async function fetchPosts(): Promise<Item[] | null> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  try {
    const { data, error } = await supabase
      .from('posts') // Supabaseのテーブル名
      .select('*')   // すべてのカラムを選択
      .order('created_at', { ascending: false }); // 作成日時で降順ソート (任意)

    if (error) {
      console.error('Error fetching posts:', error);
      return null;
    }
    // Supabaseから取得したデータの型をItem[]にキャスト (必要に応じてバリデーション)
    // 注意: SupabaseのスキーマとItem型が一致している必要があります
    return data as Item[];
  } catch (error) {
    console.error('Error in fetchPosts:', error);
    return null;
  }
}


// ページコンポーネントもasyncにする
export default async function ItemListPage() {
  // サーバーサイドでデータを取得
  const posts = await fetchPosts();

  // 月の表示順序を定義 (例: 4月から3月へ)
  const monthOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

  // 月ごとにデータをグループ化
  const postsByMonth: { [key: number]: Item[] } = {};
  if (posts) {
    posts.forEach(post => {
      if (post.months && Array.isArray(post.months)) {
        post.months.forEach(month => {
          if (!postsByMonth[month]) {
            postsByMonth[month] = [];
          }
          postsByMonth[month].push(post);
        });
      }
    });
  }

  return (
    <div>
      <h2>アイテム一覧</h2>
      {/* <p>{introduction}</p> // 不要であれば削除 */} 
      
      {/* 投稿ページへのリンク */} 
      <div style={{ marginBottom: '20px' }}>
        <Link href="/posts/new">
           <button style={{ border: '3px solid black', padding: '10px', fontFamily: 'Courier New', fontWeight: 'bold' }}>
            新しい制作物を投稿する
          </button>
        </Link>
      </div>

      {/* データ取得エラー時の表示 */} 
      {!posts && <p style={{ color: 'red' }}>データの取得に失敗しました。</p>}

      {/* 月ごとに表示 */} 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {monthOrder.map(month => (
          <div key={month} style={{ border: '3px solid black', padding: '15px' }}>
            <h3>{month}月</h3>
            {postsByMonth[month] && postsByMonth[month].length > 0 ? (
              <ul>
                {postsByMonth[month].map((item) => (
                  <li key={item.id} style={{ marginBottom: '15px', borderBottom: '1px dashed black', paddingBottom: '10px' }}>
                    <h4>{item.title}</h4>
                    <p>カテゴリ: {item.category || '未分類'}</p>
                    <p>内容: {item.content || '-'}</p>
                    {item.materials && item.materials.length > 0 && (
                       <p>材料: {item.materials.join(", ")}</p>
                    )}
                    <p>対象年齢: {item.target_age || '-'}</p>
                    {/* 他に必要な情報を表示 */} 
                  </li>
                ))}
              </ul>
            ) : (
              <p>この月の投稿はありません。</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}