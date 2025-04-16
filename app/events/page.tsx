'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './page.module.css';
import { Event } from '../types';
import EventOverlay from '../components/EventOverlay';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 季節を判定する関数
const getSeason = (month: number) => {
  if (month >= 4 && month <= 6) return 'spring';
  if (month >= 7 && month <= 9) return 'summer';
  if (month >= 10 && month <= 12) return 'autumn';
  return 'winter';
};

// 年齢グループの定義
const AGE_GROUPS = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];

// カテゴリーのスタイルを取得する関数
const getCategoryStyle = (category: string) => {
  switch (category) {
    case '壁面':
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
  if (category !== '壁面' && category !== '制作物') {
    return 'その他';
  }
  return category;
};

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
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

  // 検索機能を実装
  useEffect(() => {
    if (events.length === 0) return;

    let filtered = [...events];

    // 基本的な検索（タイトルと説明文）
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.description.toLowerCase().includes(query)
      );
    }

    // 詳細検索フィルター
    if (showAdvancedSearch) {
      // タイトル
      if (advancedFilters.title) {
        const titleQuery = advancedFilters.title.toLowerCase();
        filtered = filtered.filter(event => 
          event.title.toLowerCase().includes(titleQuery)
        );
      }

      // 説明文
      if (advancedFilters.description) {
        const descQuery = advancedFilters.description.toLowerCase();
        filtered = filtered.filter(event => 
          event.description.toLowerCase().includes(descQuery)
        );
      }

      // カテゴリー
      if (advancedFilters.category) {
        filtered = filtered.filter(event => 
          event.category === advancedFilters.category
        );
      }

      // 年齢グループ
      if (advancedFilters.ageGroups.length > 0) {
        filtered = filtered.filter(event => 
          advancedFilters.ageGroups.some(age => 
            event.age_groups.includes(age)
          )
        );
      }

      // 所要時間
      if (advancedFilters.duration) {
        filtered = filtered.filter(event => 
          event.duration.includes(advancedFilters.duration)
        );
      }

      // 準備物
      if (advancedFilters.materials.length > 0) {
        filtered = filtered.filter(event => 
          advancedFilters.materials.some(material => 
            event.materials.includes(material)
          )
        );
      }

      // 目的
      if (advancedFilters.objectives.length > 0) {
        filtered = filtered.filter(event => 
          advancedFilters.objectives.some(objective => 
            event.objectives.includes(objective)
          )
        );
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
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'popular':
          // view_countがundefinedの場合は0として扱う
          const aCount = a.view_count || 0;
          const bCount = b.view_count || 0;
          return bCount - aCount;
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, showAdvancedSearch, advancedFilters, sortOrder]);

  // 検索クエリの変更を処理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 検索ボタンクリック時の処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索は自動的に実行されるため、特別な処理は不要
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
      router.push(`/main?edit=${selectedEvent.id}`);
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
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>イベント一覧</h1>
        <Link href="/main" className={styles.backButton}>
          カレンダーに戻る
        </Link>
      </header>

      <div className={styles.searchContainer}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="イベントを検索..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            🔍
          </button>
          <button 
            type="button" 
            className={styles.advancedSearchButton}
            onClick={openAdvancedSearch}
          >
            詳細検索
          </button>
        </form>
        <div className={styles.sortContainer}>
          <button
            className={`${styles.sortButton} ${sortOrder === 'newest' ? styles.active : ''}`}
            onClick={() => setSortOrder('newest')}
          >
            新着順
          </button>
          <button
            className={`${styles.sortButton} ${sortOrder === 'oldest' ? styles.active : ''}`}
            onClick={() => setSortOrder('oldest')}
          >
            古い順
          </button>
          <button
            className={`${styles.sortButton} ${sortOrder === 'popular' ? styles.active : ''}`}
            onClick={() => setSortOrder('popular')}
          >
            人気順
          </button>
        </div>
      </div>

      <div className={styles.eventList}>
        {filteredEvents.map((event) => (
          <div 
            key={event.id} 
            className={`${styles.eventCard} ${styles[getSeason(event.month)]}`}
            onClick={() => handleEventClick(event)}
          >
            <div className={styles.eventHeader}>
              <span className={`${styles.category} ${getCategoryStyle(event.category)}`}>
                {getCategoryDisplayText(event.category)}
              </span>
              <span className={styles.date}>{event.month}月</span>
            </div>
            <h2 className={styles.title}>{event.title}</h2>
            <p className={styles.description}>{event.description}</p>
            <div className={styles.details}>
              <div className={styles.ageGroups}>
                {event.age_groups.map((age) => (
                  <span key={age} className={`${styles.ageGroup} ${getAgeGroupStyle(age)}`}>
                    {age}
                  </span>
                ))}
              </div>
              <span className={styles.duration}>{event.duration}</span>
            </div>
          </div>
        ))}
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

      {/* 詳細検索モーダル */}
      {showAdvancedSearch && (
        <div className={styles.modalOverlay} onClick={closeAdvancedSearch}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>詳細検索</h2>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>タイトル</label>
                <input
                  type="text"
                  value={advancedFilters.title}
                  onChange={e => setAdvancedFilters({...advancedFilters, title: e.target.value})}
                  placeholder="タイトルで検索"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>説明文</label>
                <input
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
                  <option value="壁面">壁面</option>
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