'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './main.module.css';
import MonthCard from './components/MonthCard';
import EventOverlay from './components/EventOverlay';
import AddEventForm from '../components/AddEventForm';
import EditEventForm from '../components/EditEventForm';
import { Event } from '../types';

type EventFormData = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

export default function MainPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const redirectToLogin = useCallback(() => {
    console.log('ログインページへリダイレクト');
    router.replace('/');
  }, [router]);

  const fetchEvents = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        redirectToLogin();
        return;
      }

      setLoading(true);
      setError(null);
      console.log('イベントを取得中...');

      const { data, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (eventsError) {
        throw eventsError;
      }

      console.log('取得したイベント:', data);
      setEvents(data || []);
    } catch (error) {
      console.error('イベント取得エラー:', error);
      setError('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, redirectToLogin]);

  // 初期化処理
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('初期化開始');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          console.log('セッションなし');
          redirectToLogin();
          return;
        }

        if (mounted) {
          console.log('セッション有効 - データ取得開始');
          await fetchEvents();
        }
      } catch (error) {
        console.error('初期化エラー:', error);
        if (mounted) {
          setError('アプリケーションの初期化に失敗しました');
        }
      } finally {
        if (mounted) {
          setIsInitialized(true);
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [supabase, fetchEvents, redirectToLogin]);

  // 認証状態の監視
  useEffect(() => {
    if (!isInitialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('認証状態の変更:', event, session);

      switch (event) {
        case 'SIGNED_IN':
          console.log('サインイン検知');
          await fetchEvents();
          break;
        case 'SIGNED_OUT':
          console.log('サインアウト検知');
          setEvents([]);
          redirectToLogin();
          break;
        case 'TOKEN_REFRESHED':
          console.log('トークン更新');
          await fetchEvents();
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, supabase, fetchEvents, redirectToLogin]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
      setError('ログアウトに失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('認証されていません');
        return;
      }

      if (selectedMonth === null) {
        setError('月が選択されていません');
        return;
      }

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
        setError('イベントの追加に失敗しました');
        return;
      }

      if (data) {
        console.log('追加されたイベント:', data);
        setEvents(prev => [...prev, ...data]);
        setShowAddForm(false);
        setSelectedMonth(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEventSubmit = async (eventData: EventFormData) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('認証されていません');
        return;
      }

      if (!selectedEvent) {
        setError('編集するイベントが選択されていません');
        return;
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
        setError('イベントの更新に失敗しました');
        return;
      }

      if (data) {
        console.log('更新されたイベント:', data);
        setEvents(prev => prev.map(event => 
          event.id === selectedEvent.id ? data[0] : event
        ));
        setShowEditForm(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('認証されていません');
        return;
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('イベント削除エラー:', error);
        setError('イベントの削除に失敗しました');
        return;
      }

      setEvents(events.filter(event => event.id !== id));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>データを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>エラーが発生しました: {error}</p>
        <button onClick={fetchEvents}>再試行</button>
      </div>
    );
  }

  const months = [
    '4月', '5月', '6月', '7月', '8月', '9月',
    '10月', '11月', '12月', '1月', '2月', '3月'
  ];

  const getMonthFromDate = (dateStr: string) => {
    const month = new Date(dateStr).getMonth() + 1; // 1-12
    // 4月始まりの配列インデックスに変換
    return month >= 4 ? month - 3 : month + 9;
  };

  return (
    <div className={styles.mainContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>保育士イベントアイディア</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>ログアウト</button>
      </header>

      <div className={styles.monthsGrid}>
        {months.map((monthName, index) => {
          const monthNumber = index + 1;
          const monthEvents = events.filter(event =>
            getMonthFromDate(event.date) === monthNumber
          );
          
          return (
            <MonthCard
              key={monthNumber}
              month={monthNumber}
              monthName={monthName}
              events={monthEvents}
              onEventClick={handleEventClick}
              onAddEvent={handleAddEvent}
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
