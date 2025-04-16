'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';
import MonthCard from '../components/MonthCard';
import EventOverlay from '../components/EventOverlay';
import AddEventForm from '../components/AddEventForm';
import EditEventForm from '../components/EditEventForm';
import { Event } from '../types';
import Link from 'next/link';

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

  const getMonthNumber = (monthName: string): number => {
    const monthStr = monthName.replace('月', '');
    const month = parseInt(monthStr);
    console.log(`月の変換: ${monthName} -> ${month}`);
    return month;
  };

  // イベントを取得する関数
  async function fetchEvents() {
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

      console.log('イベントを取得中...');
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id);

      if (eventsError) {
        console.error('イベント取得エラー:', eventsError);
        setError('イベントの取得に失敗しました');
        return;
      }

      console.log('取得したイベントデータ:', eventsData);

      if (eventsData) {
        // 月の値を数値型に変換
        const processedEvents = eventsData.map(event => ({
          ...event,
          month: Number(event.month)
        }));
        
        console.log('処理後のイベントデータ:', processedEvents);
        console.log('イベントデータをセット:', processedEvents.length, '件');
        setEvents(processedEvents);
      } else {
        console.log('イベントデータが空です');
        setEvents([]);
      }
    } catch (error) {
      console.error('予期せぬエラー:', error);
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('認証状態変更:', event);
      
      if (event === 'SIGNED_IN') {
        fetchEvents();
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
        setError('認証されていません');
        return;
      }

      if (selectedMonth === null) {
        setError('月が選択されていません');
        return;
      }

      // 日付を選択された月の1日に設定
      const date = new Date();
      const year = date.getFullYear();
      date.setMonth(selectedMonth - 1);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      if (selectedMonth >= 10) {
        date.setFullYear(year + 1);
      }

      // カテゴリーの正規化（全角スペースを保持）
      const normalizedEventData = {
        ...eventData,
        category: eventData.category.trim() // 前後の空白のみ削除
      };

      console.log('イベント追加中...', {
        selectedMonth,
        date: date.toISOString(),
        normalizedEventData
      });

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...normalizedEventData,
          date: date.toISOString(),
          month: selectedMonth,
          user_id: session.user.id,
          views: 0 // 閲覧数の初期値を設定
        })
        .select();

      if (error) {
        console.error('イベント追加エラー:', error);
        setError('イベントの追加に失敗しました');
        return;
      }

      if (data) {
        console.log('追加されたイベント:', data);
        await fetchEvents();
        setShowAddForm(false);
        setSelectedMonth(null);
        setError(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('予期せぬエラーが発生しました');
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
        await fetchEvents();
      }
      setShowEditForm(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== id));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('イベントの削除に失敗しました');
    }
  };

  const getEventsForMonth = (month: number) => {
    console.log('全イベントの月:', events.map(e => e.month));
    console.log('全イベント:', events);
    
    const monthEvents = events.filter(event => {
      // 数値型に変換して比較
      const eventMonth = Number(event.month);
      const isMatch = eventMonth === month;
      console.log(`イベントの月を比較 - イベント月: ${eventMonth} (${typeof eventMonth}), 現在の月: ${month} (${typeof month}), 一致: ${isMatch}`);
      return isMatch;
    });
    
    console.log(`${month}月のイベント数: ${monthEvents.length}`);
    console.log(`${month}月のイベント:`, monthEvents);
    return monthEvents;
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
        <button onClick={fetchEvents} className={styles.retryButton}>
          再試行
        </button>
      </div>
    );
  }

  const months = [
    '4月', '5月', '6月',        // 1行目
    '7月', '8月', '9月',        // 2行目
    '10月', '11月', '12月',     // 3行目
    '1月', '2月', '3月'         // 4行目
  ];

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
        <h1 className={styles.title}>保育アイデア管理</h1>
        <div className={styles.headerButtons}>
          <Link href="/events" className={styles.viewAllLink}>
            すべてのイベントを見る
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className={styles.logoutButton}
          >
            ログアウト
          </button>
        </div>
      </header>

      <p className={styles.description}>
        このアプリケーションは、保育士の方々が年間を通じて行うイベントやアクティビティのアイディアを管理するためのツールです。<br />
        月ごとにイベントを追加・編集・削除することができ、各イベントには目的、準備物、所要時間などの詳細な情報を記録できます。
      </p>

      <div className={styles.monthGrid}>
        {months.map((monthName) => {
          const month = getMonthNumber(monthName);
          const monthEvents = getEventsForMonth(month);
          return (
            <MonthCard
              key={monthName}
              month={month}
              monthName={monthName}
              events={monthEvents}
              onEventClick={handleEventClick}
              onAddEvent={() => handleAddEvent(month)}
              season={getSeason(monthName)}
            />
          );
        })}
      </div>

      {selectedEvent && (
        <EventOverlay
          event={selectedEvent}
          onClose={handleCloseOverlay}
          onEdit={() => setShowEditForm(true)}
          onDelete={() => handleDeleteEvent(selectedEvent.id)}
          season={getSeason(months[selectedEvent.month - 1])}
        />
      )}

      {showAddForm && selectedMonth !== null && (
        <AddEventForm
          onSubmit={handleAddEventSubmit}
          onCancel={() => {
            setShowAddForm(false);
            setSelectedMonth(null);
          }}
          selectedMonth={selectedMonth}
        />
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
