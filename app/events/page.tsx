'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './page.module.css';
import { Event, AgeGroup, EventFormData, LocalEventFormData } from '../types';
import EventOverlay from '../components/EventOverlay';
import EditEventForm from '../components/EditEventForm';
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

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortType, setSortType] = useState<'date' | 'popular'>('date');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
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

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (eventsError) {
        setError('イベントの取得に失敗しました');
        return;
      }

      console.log('取得したイベントデータ:', eventsData);
      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
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
          return event.duration.includes(advancedFilters.duration);
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
        // まず月の距離で比較
        const distanceA = getMonthDistance(a.month);
        const distanceB = getMonthDistance(b.month);
        
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
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
      setSelectedEvent(null);
    }
  };

  const handleEditEventSubmit = async (eventData: LocalEventFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証されていません');
      }

      if (!selectedEvent) {
        throw new Error('編集するイベントが選択されていません');
      }

      // media_filesをMediaFile型に変換
      const mediaFiles = await Promise.all(
        eventData.media_files.map(async (file) => {
          // ここでファイルのアップロード処理を行う必要があります
          // 仮の実装として、typeとurlを返します
          return {
            type: file.type,
            url: URL.createObjectURL(file)
          };
        })
      );

      console.log('イベント更新中...', { ...eventData, id: selectedEvent.id });
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          media_files: mediaFiles,
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
      setEditingEvent(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error:', error);
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

  // イベントカードのレンダリング部分を修正
  const renderEventCard = (event: Event) => (
    <div
      key={event.id}
      className={`${styles.eventCard} ${getMonthClass(event.month)}`}
      onClick={() => handleEventClick(event)}
    >
      <div className={styles.eventHeader}>
        <span className={`${styles.category} ${getCategoryStyle(event.category)}`}>
          {getCategoryDisplayText(event.category)}
        </span>
        <div className={styles.ageGroups}>
          {event.age_groups?.map((age) => (
            <span key={age} className={`${styles.ageGroup} ${getAgeGroupStyle(age)}`}>
              {age}
            </span>
          ))}
        </div>
      </div>
      <h3 className={styles.eventTitle}>{event.title}</h3>
      <p className={styles.eventDescription}>{event.description}</p>
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
    </div>
  );

  // 並び替え処理を行う関数
  const handleSort = (type: 'date' | 'popular') => {
    setSortType(type);
    let sorted = [...filteredEvents];

    if (type === 'date') {
      sorted.sort((a, b) => {
        const monthA = a.month || 1;
        const monthB = b.month || 1;
        if (monthA !== monthB) {
          return monthA - monthB;
        }
        // 月が同じ場合は作成日時で比較
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } else {
      sorted.sort((a, b) => {
        const viewsA = a.views || 0;
        const viewsB = b.views || 0;
        return viewsB - viewsA;
      });
    }

    setFilteredEvents(sorted);
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

      {selectedEvent && (
        <EventOverlay
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleEventDelete}
          onEdit={handleEventEdit}
          season={getSeason(selectedEvent.month)}
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
                ...editingEvent,
                media_files: [],
                materials: editingEvent.materials || [],
                objectives: editingEvent.objectives || [],
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