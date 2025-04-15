'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './main.module.css';
import MonthCard from './components/MonthCard';
import EventOverlay from './components/EventOverlay';
import AddEventForm from './components/AddEventForm';
import EditEventForm from '../components/EditEventForm';
import { Event } from '../types';

export default function MainPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        console.log('認証済みユーザー:', session.user.email);
        await fetchEvents();
      } catch (error) {
        console.error('初期化エラー:', error);
        router.push('/');
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await fetchEvents();
      } else if (event === 'SIGNED_OUT') {
        setEvents([]);
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);
      console.log('イベントを取得中...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('イベント取得エラー:', error);
        setError('イベントの取得に失敗しました');
        throw error;
      }
      
      console.log('取得したイベント:', data);
      setEvents(data || []);
    } catch (error) {
      console.error('イベントの取得に失敗しました:', error);
      setError('イベントの取得に失敗しました');
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

  const handleAddEventSubmit = async (
    title: string,
    description: string,
    date: string,
    age_group: string = '0歳児',
    category: string = '季節行事'
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      console.log('イベント追加中...', { title, date, age_group, category });
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title,
            description,
            date,
            age_group,
            category,
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
        await fetchEvents();
      }
      setShowAddForm(false);
      setSelectedMonth(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditEventSubmit = async (
    id: string,
    title: string,
    description: string,
    date: string,
    age_group: string,
    category: string
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      console.log('イベント更新中...', { id, title, date });
      const { data, error } = await supabase
        .from('events')
        .update({
          title,
          description,
          date,
          age_group,
          category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const getMonthFromDate = (dateStr: string) => {
    return new Date(dateStr).getMonth() + 1;
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
              onAddEvent={() => handleAddEvent(monthNumber)}
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

      {showAddForm && selectedMonth && (
        <AddEventForm
          month={selectedMonth}
          onSubmit={handleAddEventSubmit}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {showEditForm && selectedEvent && (
        <EditEventForm
          event={selectedEvent}
          onSubmit={handleEditEventSubmit}
          onClose={() => {
            setShowEditForm(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
