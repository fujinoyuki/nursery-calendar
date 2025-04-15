import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    
    // イベントデータの取得
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('month', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ events });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, description, month, date } = body;
    
    if (!title || !description || !month || !date) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }
    
    // イベントの作成
    const { data, error } = await supabase
      .from('events')
      .insert([
        { 
          title, 
          description, 
          month, 
          date,
          user_id: session.user.id
        }
      ])
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ event: data[0] });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, title, description, month, date } = body;
    
    if (!id || !title || !description || !month || !date) {
      return NextResponse.json({ error: '必須フィールドが不足しています' }, { status: 400 });
    }
    
    // イベントの更新
    const { data, error } = await supabase
      .from('events')
      .update({ title, description, month, date })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (data.length === 0) {
      return NextResponse.json({ error: 'イベントが見つからないか、編集権限がありません' }, { status: 404 });
    }
    
    return NextResponse.json({ event: data[0] });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'イベントIDが必要です' }, { status: 400 });
    }
    
    // イベントの削除
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 