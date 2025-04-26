'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './page.module.css';
import { Event, AgeGroup, EventFormData, LocalEventFormData, Category, MediaFile, Duration } from '../types/event';
import EventOverlay from '../components/EventOverlay';
import EditEventForm, { FormDataWithFiles } from '../components/EditEventForm';
import Image from 'next/image';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 季節を判定する関数
const getSeason = (month: number) => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

// 年齢グループの定義
const AGE_GROUPS = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];

// カテゴリーのスタイルを取得する関数
const getCategoryStyle = (category: string) => {
  switch (category) {
    case '壁　面':
    return styles.categoryWall;
    case '制作物':
    return styles.categoryArt;
    default:
  return styles.categoryOther;
  }
};

// 年齢グループのスタイルを取得する関数
const getAgeGroupStyle = (age: string) => {
  switch (age) {
    case '0歳児':
      return styles.age0;
    case '1歳児':
      return styles.age1;
    case '2歳児':
      return styles.age2;
    case '3歳児':
      return styles.age3;
    case '4歳児':
      return styles.age4;
    case '5歳児':
      return styles.age5;
    default:
      return styles.ageAll;
  }
};

// カテゴリーの表示テキストを取得する関数
const getCategoryDisplayText = (category: string) => {
  if (category !== '壁　面' && category !== '制作物') {
  return 'その他';
  }
  return category;
};

const getMonthClass = (month: number) => {
  return styles[`month${month}`];
};

// 所要時間をフォーマットする関数
const formatDuration = (duration: { start?: string, end?: string } | string | null | undefined) => {
  // 値が存在しない場合
  if (!duration) return '不明';
  
  // 文字列の場合はJSONとしてパース
  if (typeof duration === 'string') {
    try {
      const parsedDuration = JSON.parse(duration);
      return formatDuration(parsedDuration);
    } catch (e) {
      // 時間と分を抽出（例: "2時間30分"）
      const durationStr = duration as string;
      const hoursMatch = durationStr.match(/(\d+)時間/);
      const minutesMatch = durationStr.match(/(\d+)分/);
      
      if (hoursMatch || minutesMatch) {
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        
        if (hours > 0 && minutes > 0) {
          return `${hours}時間${minutes}分`;
        } else if (hours > 0) {
          return `${hours}時間`;
        } else if (minutes > 0) {
          return `${minutes}分`;
        }
      }
      return durationStr;
    }
  }
  
  // オブジェクトの場合はend値を使う
  const durationObj = duration as { start?: string, end?: string };
  const end = durationObj.end;
  if (!end) return '不明';
  
  // HH:MM形式の場合
  const timeMatch = end.match(/^(\d{1,2}):(\d{1,2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    
    if (hours > 0 && minutes > 0) {
      return `${hours}時間${minutes}分`;
    } else if (hours > 0) {
      return `${hours}時間`;
    } else if (minutes > 0) {
      return `${minutes}分`;
    }
  }
  
  return end;
};

const EventCard = ({ event, onEventClick }: { event: Event; onEventClick: (event: Event) => void }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onEventClick(event)}
    >
      {/* 画像を上部に表示 */}
      <div className="relative w-full h-48">
        {event.media_files && event.media_files.length > 0 ? (
          event.media_files[0].type === 'video' ? (
            <video
              src={event.media_files[0].url}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <Image
              src={event.media_files[0].url}
              alt={event.title}
              className="w-full h-full object-cover"
              width={400}
              height={300}
            />
          )
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
        <p className="text-gray-600 mb-2">{event.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {[...event.age_groups].sort().map((age) => (
            <span
              key={age}
              className={`px-2 py-1 rounded-full text-sm ${getAgeGroupStyle(age)}`}
            >
              {age}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-sm ${getCategoryStyle(event.category)}`}>
            {event.category}
          </span>
          <span className="text-gray-500 text-sm">{event.month}月</span>
        </div>
      </div>
    </div>
  );
};

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortType, setSortType] = useState<'date' | 'popular'>('date');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    title: '',
    description: '',
    category: '',
    ageGroups: [] as string[],
    duration: '',
    materials: [] as string[],
    objectives: [] as string[],
    hasImage: false,
    hasVideo: false
  });
  const router = useRouter();

  const fetchEvents = async () => {
    try {
    setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
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
        .order('created_at', { ascending: false });

      if (eventsError) {
        setError('イベントの取得に失敗しました');
        return;
      }
      
      // イベントデータにisOwnerフィールドを追加
      const eventsWithOwnership = eventsData?.map(event => {
        // durationの処理を改善
        let eventDuration = event.duration;
        if (typeof eventDuration === 'string') {
          try {
            eventDuration = JSON.parse(eventDuration);
          } catch (e) {
            console.error('Duration解析エラー:', e);
            
            // 文字列形式の処理（例: "2時間30分"）
            const durationStr = eventDuration as string;
            const hoursMatch = durationStr.match(/(\d+)時間/);
            const minutesMatch = durationStr.match(/(\d+)分/);
            
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            
            // formatDuration関数に渡せる形式に変換
            if (hours > 0 && minutes > 0) {
              eventDuration = `${hours}時間${minutes}分`;
            } else if (hours > 0) {
              eventDuration = `${hours}時間`;
            } else if (minutes > 0) {
              eventDuration = `${minutes}分`;
            } else {
              eventDuration = { start: '00:00', end: '00:00' };
            }
          }
        }
        
        // 空のオブジェクトかnullの場合（古いデータ互換性のため）
        if (!eventDuration) {
          eventDuration = { start: '00:00', end: '00:00' };
        }
        
        // オブジェクトだが必要なフィールドがない場合
        if (typeof eventDuration === 'object' && (!('start' in eventDuration) || !('end' in eventDuration) || !eventDuration.start || !eventDuration.end)) {
          eventDuration = { start: '00:00', end: '00:00' };
        }
        
        return {
        ...event,
          category: (event.category || 'その他') as Category,
          age_groups: (event.age_groups || []) as AgeGroup[],
          media_files: (event.media_files || []).map((file: { type: string; url: string }) => ({
            type: file.type,
            url: file.url
          })) as MediaFile[],
          views: event.views || 0,
          isOwner: event.user_id === session.user.id,
          profiles: event.profiles || null,
          duration: eventDuration
        };
      }) as Event[];
      
      console.log('取得したイベントデータ:', eventsWithOwnership);
      setEvents(eventsWithOwnership);
      setFilteredEvents(eventsWithOwnership);
    } catch (error) {
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // イベントが更新されたときにイベント一覧を再取得する
  useEffect(() => {
    if (selectedEvent) {
    const channel = supabase
        .channel('events_changes')
      .on('postgres_changes', 
        { 
            event: 'UPDATE', 
          schema: 'public', 
            table: 'events',
            filter: `id=eq.${selectedEvent.id}`
        }, 
          () => {
          fetchEvents();
        }
      )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    }
  }, [selectedEvent]);

  // 現在の月を取得
  const currentMonth = new Date().getMonth() + 1; // JavaScriptの月は0から始まるため+1

  // 月の比較関数（現在の月からの距離を計算）
  const getMonthDistance = (month: number) => {
    const diff = month - currentMonth;
    return diff >= 0 ? diff : diff + 12;
  };

  // 検索機能とソート機能を実装
  useEffect(() => {
    if (events.length === 0) return;

    let filtered = [...events];

    // 基本的な検索（タイトルと説明文）
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(query) || 
        event.description?.toLowerCase().includes(query) ||
        event.category?.toLowerCase().includes(query)
      );
    }

    // 詳細検索フィルター
    if (showAdvancedSearch) {
      // タイトル
      if (advancedFilters.title) {
        const titleQuery = advancedFilters.title.toLowerCase();
        filtered = filtered.filter(event => 
          event.title?.toLowerCase().includes(titleQuery)
        );
      }

      // 説明文
      if (advancedFilters.description) {
        const descQuery = advancedFilters.description.toLowerCase();
        filtered = filtered.filter(event => 
          event.description?.toLowerCase().includes(descQuery)
        );
      }

      // 年齢グループ
      if (advancedFilters.ageGroups.length > 0) {
        filtered = filtered.filter(event => {
          if (!event.age_groups || !Array.isArray(event.age_groups)) return false;
          return advancedFilters.ageGroups.some(age => event.age_groups.includes(age as AgeGroup));
        });
      }

      // カテゴリー
      if (advancedFilters.category) {
        filtered = filtered.filter(event => {
          const eventCategory = event.category || 'その他';
          return eventCategory === advancedFilters.category;
        });
      }

      // 所要時間
      if (advancedFilters.duration) {
        filtered = filtered.filter(event => {
          if (!event.duration) return false;
          const durationStr = `${event.duration.start}～${event.duration.end}`;
          return durationStr.includes(advancedFilters.duration);
        });
      }

      // 準備物
      if (advancedFilters.materials.length > 0) {
        filtered = filtered.filter(event => {
          if (!event.materials || !Array.isArray(event.materials)) return false;
          return advancedFilters.materials.every(material => 
            event.materials.some(m => m.includes(material))
          );
        });
      }

      // 目的
      if (advancedFilters.objectives.length > 0) {
        filtered = filtered.filter(event => {
          if (!event.objectives || !Array.isArray(event.objectives)) return false;
          return advancedFilters.objectives.every(objective => 
            event.objectives.some(o => o.includes(objective))
          );
        });
      }

      // 画像あり
      if (advancedFilters.hasImage) {
        filtered = filtered.filter(event => 
          event.media_files && event.media_files.some(file => 
            file.type.startsWith('image/')
          )
        );
      }

      // 動画あり
      if (advancedFilters.hasVideo) {
      filtered = filtered.filter(event => 
          event.media_files && event.media_files.some(file => 
            file.type.startsWith('video/')
          )
        );
      }
    }

    // 並び替え
    if (sortType === 'date') {
      filtered.sort((a, b) => {
        // 月を数値として比較
        const monthA = Number(a.month);
        const monthB = Number(b.month);
        
        if (monthA !== monthB) {
          return monthA - monthB;
        }
        
        // 月が同じ場合は作成日時で比較
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortType === 'popular') {
      filtered.sort((a, b) => {
        const viewsA = a.views || 0;
        const viewsB = b.views || 0;
        if (viewsA !== viewsB) {
          return viewsB - viewsA;
        }
        // 閲覧数が同じ場合は作成日時で比較
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, showAdvancedSearch, advancedFilters, sortType, currentMonth]);

  // 検索クエリの変更を処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索は自動的に実行されるため、フォームのデフォルトの送信を防ぐだけ
  };

  // 詳細検索モーダルを開く
  const openAdvancedSearch = () => {
    setShowAdvancedSearch(true);
  };

  // 詳細検索モーダルを閉じる
  const closeAdvancedSearch = () => {
    setShowAdvancedSearch(false);
  };

  // 詳細検索フィルターをリセット
  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      title: '',
      description: '',
      category: '',
      ageGroups: [],
      duration: '',
      materials: [],
      objectives: [],
      hasImage: false,
      hasVideo: false
    });
  };

  // 詳細検索フィルターを適用
  const applyAdvancedFilters = () => {
    // 検索は自動的に実行されるため、モーダルを閉じるだけ
    setShowAdvancedSearch(false);
  };

  const handleEventClick = async (event: Event) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      // イベントの閲覧数を更新
      const { error, data } = await supabase
        .from('events')
        .update({ views: (event.views || 0) + 1 })
        .eq('id', event.id)
        .select(`
          *,
          profiles (
            name
          )
        `);

      if (error) throw error;

      if (data && data.length > 0) {
        // durationの処理
        let eventDuration = data[0].duration;
        if (typeof eventDuration === 'string') {
          try {
            eventDuration = JSON.parse(eventDuration);
          } catch (e) {
            // 文字列形式の処理（例: "2時間30分"）
            const durationStr = eventDuration as string;
            const hoursMatch = durationStr.match(/(\d+)時間/);
            const minutesMatch = durationStr.match(/(\d+)分/);
            
            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
            
            // 直接表示用の形式に変換
            if (hours > 0 && minutes > 0) {
              eventDuration = `${hours}時間${minutes}分`;
            } else if (hours > 0) {
              eventDuration = `${hours}時間`;
            } else if (minutes > 0) {
              eventDuration = `${minutes}分`;
            } else {
              eventDuration = { start: '00:00', end: '00:00' };
            }
          }
        }
        
        // 空のオブジェクトかnullの場合
        if (!eventDuration) {
          eventDuration = { start: '00:00', end: '00:00' };
        }
        
        // オブジェクトだが必要なフィールドがない場合
        if (typeof eventDuration === 'object' && (!('start' in eventDuration) || !('end' in eventDuration) || !eventDuration.start || !eventDuration.end)) {
          eventDuration = { start: '00:00', end: '00:00' };
        }
        
        // データを加工
        const updatedEvent = {
          ...data[0],
          category: (data[0].category || 'その他') as Category,
          age_groups: (data[0].age_groups || []) as AgeGroup[],
          media_files: (data[0].media_files || []).map((file: { type: string; url: string }) => ({
            type: file.type,
            url: file.url
          })) as MediaFile[],
          views: data[0].views || 0,
          isOwner: data[0].user_id === session.user.id,
          profiles: data[0].profiles || null,
          duration: eventDuration
        };
        
        // 更新されたイベントをステートに設定
        setSelectedEvent(updatedEvent);
        setIsOverlayOpen(true);
      } else {
        // データがない場合は既存のイベントを使用
        setSelectedEvent(event);
        setIsOverlayOpen(true);
      }
    } catch (error) {
      console.error('イベントの更新中にエラーが発生しました:', error);
      // エラーが発生しても表示はする
      setSelectedEvent(event);
      setIsOverlayOpen(true);
    }
  };

  const handleEventDelete = async (id: string) => {
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

  const handleEventEdit = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
    }
  };

  const handleEditEventSubmit = async (formData: FormDataWithFiles) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      if (!editingEvent) {
        throw new Error('編集するイベントが選択されていません');
      }

      // media_filesの中からFileオブジェクトだけを抽出
      const files = formData.media_files.filter(file => file instanceof File) as File[];
      const existingMediaFiles = formData.media_files.filter(file => !(file instanceof File)) as MediaFile[];
      
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

      const { data, error } = await supabase
        .from('events')
        .update({
          ...formData,
          media_files: allMediaFiles,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEvent.id)
        .select();

      if (error) {
        console.error('イベント更新エラー:', error);
        alert('イベントの更新に失敗しました: ' + error.message);
        return;
      }

      if (data) {
        console.log('更新されたイベント:', data);
        await fetchEvents();
      }
      setEditingEvent(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'ファイルのアップロード中にエラーが発生しました');
    }
  };

  const handleEditCancel = () => {
    if (window.confirm('編集をキャンセルしてもよろしいですか？')) {
      setEditingEvent(null);
    }
  };

  // モーダルの外側クリック時の処理を追加
  const handleModalOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleEditCancel();
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
        return;
      }
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // 並び替え処理を行う関数
  const handleSort = (type: 'date' | 'popular') => {
    setSortType(type);
    const sorted = [...events].sort((a, b) => {
      if (type === 'date') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
        const dateB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
        return dateB - dateA;
    } else {
        // 人気順（閲覧数で降順）
        const viewsA = a.views || 0;
        const viewsB = b.views || 0;
        if (viewsA !== viewsB) {
          return viewsB - viewsA;
        }
        // 閲覧数が同じ場合は作成日時で比較
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      }
    });
    setFilteredEvents(sorted);
  };

  // イベントカードのレンダリング部分を修正
  const renderEventCard = (event: Event) => (
    <div key={event.id} className={getMonthClass(Number(event.month))}>
      <div
        className={styles.eventCard}
        onClick={() => handleEventClick(event)}
      >
        <div className={styles.eventImageContainer}>
          {event.media_files?.some(file => file.type.startsWith('image/')) && 
           event.media_files.find(file => file.type.startsWith('image/'))?.url ? (
            <Image
              src={event.media_files.find(file => file.type.startsWith('image/'))!.url}
              alt={event.title}
              width={200}
              height={200}
              className={styles.eventImage}
            />
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}
        </div>
        <div className={styles.eventContent}>
          <div className={styles.eventHeader}>
            <span className={`${styles.category} ${getCategoryStyle(event.category)}`}>
              {getCategoryDisplayText(event.category)}
            </span>
            <h3 className={styles.eventTitle}>{event.title}</h3>
          </div>
          <p className={styles.eventDescription}>{event.description}</p>
          <div className={styles.ageGroups}>
            {[...event.age_groups]
              .sort((a, b) => Number(a) - Number(b))
              .map((age) => (
                <span key={age} className={`${styles.ageGroup} ${getAgeGroupStyle(age)}`}>
                {age}
              </span>
            ))}
          </div>
          <div className={styles.eventFooter}>
            <span className={styles.month}>{event.month}月</span>
            <div className={styles.rightFooter}>
              <span className={styles.duration}>所要時間：{formatDuration(event.duration)}</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    );

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
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>イベント一覧</h1>
          <div className={styles.headerButtons}>
            <button 
              type="button"
              onClick={handleLogout} 
              className={styles.logoutButton}
            >
              ログアウト
            </button>
            <Link 
              href="/main" 
              className={styles.backButton}
              prefetch={false}
            >
              カレンダーに戻る
            </Link>
          </div>
        </header>

        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <input
              type="text"
              placeholder="イベントを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              autoComplete="off"
            />
            <div className={styles.searchButtons}>
              <button 
                type="submit" 
                className={styles.searchButton}
              >
                検索
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(true)}
                className={styles.advancedSearchButton}
              >
                詳細検索
              </button>
            </div>
          </form>
          <div className={styles.sortContainer}>
            <button
              type="button"
              className={`${styles.sortButton} ${sortType === 'date' ? styles.active : ''}`}
              onClick={() => handleSort('date')}
            >
              日付順
            </button>
            <button
              type="button"
              className={`${styles.sortButton} ${sortType === 'popular' ? styles.active : ''}`}
              onClick={() => handleSort('popular')}
            >
              人気順
            </button>
          </div>
        </div>

        <div className={styles.eventsGrid}>
          {filteredEvents.map(renderEventCard)}
            </div>
        </div>
        
      {selectedEvent && isOverlayOpen && (
        <EventOverlay
          event={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            setIsOverlayOpen(false);
          }}
          onDelete={handleEventDelete}
          onEdit={handleEventEdit}
          season={getSeason(Number(selectedEvent.month))}
        />
      )}

      {editingEvent && (
        <div className={styles.modalOverlay} onClick={handleModalOverlayClick}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>イベントの編集</h2>
            </div>
            <EditEventForm
              data={{
                title: editingEvent.title,
                description: editingEvent.description,
                category: editingEvent.category,
                month: editingEvent.month,
                date: editingEvent.date,
                duration: editingEvent.duration,
                materials: editingEvent.materials || [],
                objectives: editingEvent.objectives || [],
                age_groups: editingEvent.age_groups,
                media_files: []
              }}
              onSubmit={handleEditEventSubmit}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}

      {/* 詳細検索モーダル */}
      {showAdvancedSearch && (
        <div className={styles.modalOverlay} onClick={closeAdvancedSearch}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>詳細検索</h2>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="title">タイトル</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={advancedFilters.title}
                  onChange={e => setAdvancedFilters({...advancedFilters, title: e.target.value})}
                  placeholder="タイトルで検索"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">説明文</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={advancedFilters.description}
                  onChange={e => setAdvancedFilters({...advancedFilters, description: e.target.value})}
                  placeholder="説明文で検索"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>カテゴリー</label>
                <select
                  value={advancedFilters.category}
                  onChange={e => setAdvancedFilters({...advancedFilters, category: e.target.value})}
                >
                  <option value="">すべて</option>
                  <option value="壁　面">壁　面</option>
                  <option value="制作物">制作物</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>対象年齢</label>
                <div className={styles.checkboxGroup}>
                  {AGE_GROUPS.map(age => (
                    <label key={age} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={advancedFilters.ageGroups.includes(age)}
                        onChange={e => {
                          if (e.target.checked) {
                            setAdvancedFilters({
                              ...advancedFilters,
                              ageGroups: [...advancedFilters.ageGroups, age]
                            });
                          } else {
                            setAdvancedFilters({
                              ...advancedFilters,
                              ageGroups: advancedFilters.ageGroups.filter(a => a !== age)
                            });
                          }
                        }}
                      />
                      {age}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>所要時間</label>
                <input
                  type="text"
                  value={advancedFilters.duration}
                  onChange={e => setAdvancedFilters({...advancedFilters, duration: e.target.value})}
                  placeholder="例: 30分"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>準備物</label>
                <input
                  type="text"
                  value={advancedFilters.materials.join('、')}
                  onChange={e => {
                    const items = e.target.value.split(/[、・\s]+/).filter(item => item.trim() !== '');
                    setAdvancedFilters({...advancedFilters, materials: items});
                  }}
                  placeholder="例: 画用紙、クレヨン"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>目的</label>
                <input
                  type="text"
                  value={advancedFilters.objectives.join('、')}
                  onChange={e => {
                    const items = e.target.value.split(/[、・\s]+/).filter(item => item.trim() !== '');
                    setAdvancedFilters({...advancedFilters, objectives: items});
                  }}
                  placeholder="例: 創造性を育む、手先の器用さを養う"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>メディア</label>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={advancedFilters.hasImage}
                      onChange={e => setAdvancedFilters({...advancedFilters, hasImage: e.target.checked})}
                    />
                    画像ありのみ表示
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={advancedFilters.hasVideo}
                      onChange={e => setAdvancedFilters({...advancedFilters, hasVideo: e.target.checked})}
                    />
                    動画ありのみ表示
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.resetButton} 
                onClick={resetAdvancedFilters}
              >
                リセット
              </button>
              <button 
                className={styles.cancelButton} 
                onClick={closeAdvancedSearch}
              >
                キャンセル
              </button>
              <button 
                className={styles.applyButton} 
                onClick={applyAdvancedFilters}
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 