import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.localファイルを読み込み
dotenv.config({ path: '.env.local' });
// バックアップとして.envも読み込み
dotenv.config();

// 環境変数が読み込まれているか確認
console.log('環境変数確認:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUserInfo() {
  console.log('ユーザー情報の取得を開始します...');

  try {
    // ユーザーセッションの取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('セッション取得エラー:', sessionError);
      return;
    }
    
    if (!sessionData.session) {
      console.log('ログインされていません。ログインが必要です。');
      return;
    }
    
    console.log('ログイン中のユーザー:');
    console.log('ユーザーID:', sessionData.session.user.id);
    console.log('メールアドレス:', sessionData.session.user.email);
    
    // プロファイル情報も取得
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();
    
    if (profileError) {
      console.error('プロファイル取得エラー:', profileError);
    } else if (profileData) {
      console.log('プロファイル情報:', profileData);
    }
    
    // すべてのユーザーを取得（管理用）
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .limit(10);
    
    if (usersError) {
      console.error('ユーザー一覧取得エラー:', usersError);
    } else {
      console.log('登録ユーザー一覧:');
      console.log(allUsers);
    }
    
    // イベントの所有者を確認
    const { data: eventOwners, error: ownersError } = await supabase
      .from('events')
      .select('user_id')
      .limit(1);
    
    if (ownersError) {
      console.error('イベント所有者取得エラー:', ownersError);
    } else if (eventOwners && eventOwners.length > 0) {
      console.log('イベントの所有者ID:', eventOwners[0].user_id);
    }
    
    return sessionData.session.user.id;
  } catch (error) {
    console.error('予期せぬエラー:', error);
  }
}

// スクリプトの実行
getUserInfo().catch(console.error); 