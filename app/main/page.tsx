'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import styles from './main.module.css';
import MonthCard from './components/MonthCard';
import EventOverlay from './components/EventOverlay';
import AddEventForm from './components/AddEventForm';

// Define types
interface Event {
  id: string;
  month: number;
  title: string;
  description: string;
}

export default function MainPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        fetchEvents();
      }
    };

    checkSession();
  }, [router]);

  // Fetch events from Supabase
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('month', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle event click to show overlay
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  // Handle close overlay
  const handleCloseOverlay = () => {
    setSelectedEvent(null);
  };

  // Open add event form
  const handleAddEvent = (month: number) => {
    setSelectedMonth(month);
    setShowAddForm(true);
  };

  // Handle add event submission
  const handleAddEventSubmit = async (title: string, description: string) => {
    if (!selectedMonth) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          { month: selectedMonth, title, description }
        ])
        .select();

      if (error) {
        console.error('Error adding event:', error);
        return;
      }

      if (data) {
        setEvents([...events, ...data]);
      }
      setShowAddForm(false);
      setSelectedMonth(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        return;
      }

      setEvents(events.filter(event => event.id !== id));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Get months array for rendering
  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <div className={styles.mainContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>保育士イベントアイディア</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>ログアウト</button>
      </header>

      <div className={styles.monthsGrid}>
        {months.map((monthName, index) => {
          const monthNumber = index + 1;
          const monthEvents = events.filter(event => event.month === monthNumber);
          
          return (
            <MonthCard
              key={monthNumber}
              month={monthName}
              events={monthEvents}
              onEventClick={handleEventClick}
              onAddEvent={() => handleAddEvent(monthNumber)}
            />
          );
        })}
      </div>

      {selectedEvent && (
        <EventOverlay
          event={selectedEvent}
          onClose={handleCloseOverlay}
          onDelete={handleDeleteEvent}
        />
      )}

      {showAddForm && (
        <AddEventForm
          onSubmit={handleAddEventSubmit}
          onCancel={() => setShowAddForm(false)}
          month={selectedMonth ? months[selectedMonth - 1] : ''}
        />
      )}
    </div>
  );
}
