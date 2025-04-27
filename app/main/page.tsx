'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';
import MonthCard from '../components/MonthCard';
import EventOverlay from '../components/EventOverlay';
import AddEventForm from '../components/AddEventForm';
import EditEventForm, { FormDataWithFiles } from '../components/EditEventForm';
import { Event, EventFormData, Category, AgeGroup, MediaFile, Duration, LocalEventFormData } from '../types/event';
import Link from 'next/link';
import { months } from '../utils/constants';

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
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  const [newEventId, setNewEventId] = useState<string | null>(null);
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
        .select(`
          *,
          profiles (
            name
          )
        `)
        .order('views', { ascending: false });

      if (eventsError) {
        console.error('イベント取得エラー:', eventsError);
        setError('イベントの取得に失敗しました');
        return;
      }

      console.log('取得したイベントデータ:', eventsData);
      
      // durationフィールドの内容をデバッグ出力
      if (eventsData && eventsData.length > 0) {
        console.log('最初のイベントのduration:', eventsData[0].duration);
        
        // 全イベントのdurationをチェック
        eventsData.forEach((event, index) => {
          console.log(`イベント[${index}] ${event.title}のduration:`, event.duration);
        });
      }

      if (eventsData) {
        // イベントデータにisOwnerフィールドを追加し、月を数値型に変換
        const processedEvents = eventsData.map(event => {
          // durationフィールドの処理
          let eventDuration = event.duration;
          
          // 文字列として保存されている場合
          if (typeof eventDuration === 'string') {
            try {
              eventDuration = JSON.parse(eventDuration);
              console.log('パース後のduration:', eventDuration);
            } catch (e) {
              console.error('Duration解析エラー:', e);
              // "2時間30分"形式かもしれない
              const durationStr = eventDuration as string;
              const hoursMatch = durationStr.match(/(\d+)時間/);
              const minutesMatch = durationStr.match(/(\d+)分/);
              
              const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
              const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
              
              // Durationオブジェクトに変換
              eventDuration = {
                start: "00:00",
                end: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
              };
              console.log('時間文字列からのduration:', eventDuration);
            }
          }
          
          // nullやundefinedの場合や、不正な形式の場合
          if (!eventDuration || typeof eventDuration !== 'object' || 
              !('start' in eventDuration) || !('end' in eventDuration) ||
              !eventDuration.start || !eventDuration.end) {
            eventDuration = { start: "00:00", end: "00:00" };
            console.log('デフォルトdurationを使用:', eventDuration);
          }
          
          return {
            ...event,
            month: String(event.month), // 文字列型として扱う
            isOwner: event.user_id === session.user.id,
            duration: eventDuration as Duration
          };
        });
        
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

  // フィードバックメッセージを表示する関数
  const showFeedback = (message: string, type: 'success' | 'error' | 'warning') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000); // 3秒後に消える
  };

  // イベントの重複をチェックする関数
  const checkDuplicateEvent = (eventData: LocalEventFormData, month: number): boolean => {
    const monthEvents = getEventsForMonth(month);
    return monthEvents.some(existingEvent => 
      existingEvent.title === eventData.title ||
      (existingEvent.description === eventData.description && 
       existingEvent.category === eventData.category)
    );
  };

  const handleAddEventSubmit = async (eventData: LocalEventFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showFeedback('認証されていません', 'error');
        return;
      }

      if (selectedMonth === null) {
        showFeedback('月が選択されていません', 'error');
        return;
      }

      // 重複チェック
      if (checkDuplicateEvent(eventData, selectedMonth)) {
        const confirmAdd = window.confirm(
          '似たイベントが既に存在します。それでも追加しますか？'
        );
        if (!confirmAdd) {
          showFeedback('イベントの追加をキャンセルしました', 'warning');
          return;
        }
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

      // stringからDuration型に変換（例: "2時間30分" -> { start: "00:00", end: "02:30" }）
      const durationString = eventData.duration;
      const durationObj: Duration = {
        start: "00:00",
        end: "00:00"
      };
      
      // 時間と分を抽出
      const hoursMatch = durationString.match(/(\d+)時間/);
      const minutesMatch = durationString.match(/(\d+)分/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      
      // 終了時間を計算
      durationObj.end = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      console.log('設定する所要時間:', durationString, '->', durationObj);

      // カテゴリーの正規化（全角スペースを保持）
      const normalizedEventData = {
        ...eventData,
        duration: durationObj,
        category: eventData.category.trim()
      };

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...normalizedEventData,
          date: new Date(date).toISOString(), // 常に選択された月の1日を使用
          month: selectedMonth.toString(), // 文字列として保存
          user_id: session.user.id,
          views: 0
        })
        .select();

      if (error) {
        console.error('イベント追加エラー:', error);
        showFeedback('イベントの追加に失敗しました', 'error');
        return;
      }

      if (data) {
        console.log('追加されたイベント:', data);
        setNewEventId(data[0].id); // アニメーション用にIDを保存
        showFeedback('イベントを追加しました', 'success');
        await fetchEvents();
        setShowAddForm(false);
        setSelectedMonth(null);

        // 3秒後にアニメーション状態をリセット
        setTimeout(() => setNewEventId(null), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      showFeedback('予期せぬエラーが発生しました', 'error');
    }
  };

  const handleEditEventSubmit = async (eventData: FormDataWithFiles) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showFeedback('認証されていません', 'error');
        return;
      }

      if (!selectedEvent) {
        showFeedback('編集するイベントが選択されていません', 'error');
        return;
      }

      // media_filesの中からFileオブジェクトだけを抽出
      const files = eventData.media_files.filter(file => file instanceof File) as File[];
      const existingMediaFiles = eventData.media_files.filter(file => !(file instanceof File)) as MediaFile[];
      
      // ファイルサイズの制限（5MB）
      const MAX_FILE_SIZE = 5 * 1024 * 1024;

      // 新しいファイルをアップロード
      const newMediaFiles = await Promise.all(
        files.map(async (file: File) => {
          try {
            console.log('処理中のファイル:', file.name, file.type, file.size);

            // ファイルサイズのチェック
            if (file.size > MAX_FILE_SIZE) {
              throw new Error(`ファイル ${file.name} が大きすぎます。5MB以下のファイルを選択してください。`);
            }

            // 許可されるファイルタイプ
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
            if (!allowedTypes.includes(file.type)) {
              throw new Error(`ファイル ${file.name} の形式がサポートされていません。`);
            }

            // ファイル名を一意にする
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            console.log('アップロード前のファイル名:', fileName);

            // ファイルをストレージにアップロード
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('event-media')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('ファイルアップロードエラー:', uploadError);
              throw uploadError;
            }

            console.log('アップロード成功:', uploadData);

            // アップロードしたファイルのURLを取得
            const { data: { publicUrl } } = supabase.storage
              .from('event-media')
              .getPublicUrl(fileName);

            console.log('取得したパブリックURL:', publicUrl);

            // ファイルタイプを判断
            const type = file.type.startsWith('image/') ? 'image' : 'video';
            
            return {
              type,
              url: publicUrl
            } as MediaFile;
          } catch (error) {
            console.error('ファイル処理エラー:', error);
            throw error;
          }
        })
      );

      // 既存のメディアファイルと新しくアップロードしたファイルを結合
      const allMediaFiles = [...existingMediaFiles, ...newMediaFiles];

      // eventDataがLocalEventFormDataの場合もFormDataWithFilesに変換して扱う
      const updateData = {
        ...eventData,
        media_files: allMediaFiles,
        // 必ず文字列型の月を使用
        month: String(eventData.month)
      };

      const { data, error } = await supabase
        .from('events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEvent.id)
        .select();

      if (error) {
        console.error('イベント更新エラー:', error);
        showFeedback('イベントの更新に失敗しました', 'error');
        return;
      }

      await fetchEvents();
      setSelectedEvent(null);
      setShowEditForm(false);
      showFeedback('イベントを更新しました', 'success');
    } catch (error) {
      console.error('Error:', error);
      showFeedback(error instanceof Error ? error.message : 'ファイルのアップロード中にエラーが発生しました', 'error');
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
      // 文字列型の月を数値に変換して比較（互換性のため）
      const eventMonth = Number(event.month);
      const isMatch = eventMonth === month;
      console.log(`イベントの月を比較 - イベント月: ${eventMonth} (${typeof eventMonth}), 現在の月: ${month} (${typeof month}), 一致: ${isMatch}`);
      return isMatch;
    });
    
    console.log(`${month}月のイベント数: ${monthEvents.length}`);
    console.log(`${month}月のイベント:`, monthEvents);
    return monthEvents;
  };

  const convertEventToFormData = (event: Event): EventFormData => {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      month: event.month,
      date: event.date,
      duration: event.duration,
      materials: event.materials,
      objectives: event.objectives,
      age_groups: event.age_groups,
      media_files: event.media_files
    };
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
      {feedback && (
        <div className={`${styles.feedbackMessage} ${styles[feedback.type]}`}>
          {feedback.message}
        </div>
      )}
      
      <div className={styles.headerWrapper}>
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
      </div>

      <div className={styles.descriptionContainer}>
        <p className={styles.description}>
          このアプリケーションは、保育士の方々が年間を通じて行うイベントやアクティビティのアイディアを管理するためのツールです。<br />
          月ごとにイベントを追加・編集・削除することができ、各イベントには目的、準備物、所要時間などの詳細な情報を記録できます。
        </p>
      </div>

      <div className={styles.monthGrid}>
        {months.map((monthName) => {
          const month = getMonthNumber(monthName);
          const monthEvents = getEventsForMonth(month);
          return (
            <MonthCard
              key={`month-${month}`}
              month={month}
              monthName={monthName}
              events={monthEvents}
              onEventClick={handleEventClick}
              onAddClick={() => handleAddEvent(month)}
              season={getSeason(monthName)}
              newEventId={newEventId}
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
          season={getSeason(months[parseInt(selectedEvent.month) - 1])}
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
              data={convertEventToFormData(selectedEvent)}
              onSubmit={handleEditEventSubmit}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}