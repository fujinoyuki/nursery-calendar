'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';
import MonthCard from './components/MonthCard';
import EventOverlay from './components/EventOverlay';
import AddEventForm from '../components/AddEventForm';
import EditEventForm from '../components/EditEventForm';
import { Event } from '../types';

type EventFormData = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MainPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const router = useRouter();

  // セッションチェックとデータ取得を行う関数
  async function checkSessionAndFetchEvents() {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('セッションエラー:', sessionError);
        setError('セッションの取得に失敗しました');
        return;
      }

      if (!session) {
        console.log('セッションなし - ログインページへリダイレクト');
        router.push('/');
        return;
      }

      console.log('セッション有効 - イベント取得開始');
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('イベント取得エラー:', eventsError);
        setError('イベントの取得に失敗しました');
        return;
      }

      console.log('イベント取得成功:', eventsData?.length || 0, '件');
      setEvents(eventsData || []);
    } catch (error) {
      console.error('予期せぬエラー:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 初期データ取得
    checkSessionAndFetchEvents();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('認証状態変更:', event);
      
      if (event === 'SIGNED_IN') {
        checkSessionAndFetchEvents();
      } else if (event === 'SIGNED_OUT') {
        setEvents([]);
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseOverlay = () => {
    setSelectedEvent(null);
  };

  const handleAddEvent = (month: number) => {
    setSelectedMonth(month);
    setShowAddForm(true);
  };

  const handleAddEventSubmit = async (eventData: EventFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      if (selectedMonth === null) {
        throw new Error('月が選択されていません');
      }

      // 選択された月の日付を設定
      const date = new Date();
      date.setMonth(selectedMonth >= 9 ? selectedMonth - 9 : selectedMonth + 3);
      date.setDate(1);

      console.log('イベント追加中...', { ...eventData, date: date.toISOString() });
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            ...eventData,
            date: date.toISOString(),
            user_id: session.user.id
          }
        ])
        .select();

      if (error) {
        console.error('イベント追加エラー:', error);
        return;
      }

      if (data) {
        console.log('追加されたイベント:', data);
        await checkSessionAndFetchEvents();
      }
      setShowAddForm(false);
      setSelectedMonth(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditEventSubmit = async (eventData: EventFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      if (!selectedEvent) {
        throw new Error('編集するイベントが選択されていません');
      }

      console.log('イベント更新中...', { ...eventData, id: selectedEvent.id });
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEvent.id)
        .eq('user_id', session.user.id)
        .select();

      if (error) {
        console.error('イベント更新エラー:', error);
        return;
      }

      if (data) {
        console.log('更新されたイベント:', data);
        await checkSessionAndFetchEvents();
      }
      setShowEditForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('イベント削除エラー:', error);
        return;
      }

      setEvents(events.filter(event => event.id !== id));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>データを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={checkSessionAndFetchEvents}>再試行</button>
      </div>
    );
  }

  const months = [
    '4月', '5月', '6月',        // 1行目
    '7月', '8月', '9月',        // 2行目
    '10月', '11月', '12月',     // 3行目
    '1月', '2月', '3月'         // 4行目
  ];

  const getMonthFromDate = (dateStr: string) => {
    const month = new Date(dateStr).getMonth() + 1;
    return month >= 4 ? month - 3 : month + 9;
  };

  const getSeason = (monthStr: string) => {
    const monthNumber = monthStr.replace('月', '');
    const month = parseInt(monthNumber);
    if ([4, 5, 6].includes(month)) return 'spring';    // 4-6月：春
    if ([7, 8, 9].includes(month)) return 'summer';    // 7-9月：夏
    if ([10, 11, 12].includes(month)) return 'autumn'; // 10-12月：秋
    return 'winter';                                   // 1-3月：冬
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>保育士イベントアイディア</h1>
        <button onClick={() => supabase.auth.signOut()} className={styles.logoutButton}>
          ログアウト
        </button>
      </header>

      <div className={styles.descriptionContainer}>
        <p className={styles.description}>
          このアプリケーションは、保育士の方々が年間を通じて行うイベントやアクティビティのアイディアを管理するためのツールです。
        </p>
        <p className={styles.description}>
          月ごとにイベントを追加・編集・削除することができ、各イベントには目的、準備物、所要時間などの詳細な情報を記録できます。
        </p>
      </div>

      <div className={styles.eventsContainer}>
        {months.map((monthName, index) => {
          const monthNumber = parseInt(monthName);
          const monthEvents = events.filter(event => 
            getMonthFromDate(event.date) === index
          );
          
          return (
            <MonthCard
              key={monthNumber}
              month={monthNumber}
              monthName={monthName}
              events={monthEvents}
              onEventClick={handleEventClick}
              onAddEvent={() => handleAddEvent(monthNumber)}
              season={getSeason(monthName)}
            />
          );
        })}
      </div>

      {selectedEvent && !showEditForm && (
        <EventOverlay
          event={selectedEvent}
          onClose={handleCloseOverlay}
          onDelete={handleDeleteEvent}
          onEdit={() => setShowEditForm(true)}
        />
      )}

      {showAddForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <AddEventForm
              onSubmit={handleAddEventSubmit}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {showEditForm && selectedEvent && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <EditEventForm
              event={selectedEvent}
              onSubmit={handleEditEventSubmit}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
