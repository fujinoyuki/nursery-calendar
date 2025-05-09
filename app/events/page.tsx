'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './page.module.css';
import { Event, AgeGroup, EventFormData, Category, MediaFile, Duration } from '../types/event';
import EventOverlay from '../components/EventOverlay';
import EditEventForm from '../components/EditEventForm';
import Image from 'next/image';

// 編集フォームからのデータを受け取るための型
type EditFormData = Omit<EventFormData, 'media_files'> & {
  media_files: (MediaFile | File)[];
};

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
  if (!category || (category !== '壁　面' && category !== '制作物')) {
  return 'その他';
  }
  return category;
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

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortType, setSortType] = useState<'date' | 'popular'>('popular');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [imageBlobUrls, setImageBlobUrls] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 15;
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

      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError('セッションの取得に失敗しました');
        return;
      }

      if (!session) {
        router.push('/');
        return;
      }

      // イベントデータの取得
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
        setError('イベントの取得中に予期せぬエラーが発生しました');
        return;
      }

      if (eventsData) {
        // イベントデータを処理
        const processedEvents = eventsData.map(event => {
          let eventDuration = event.duration;

          // null/undefined チェック
          if (!eventDuration) {
            return {
              ...event,
              isOwner: event.user_id === session.user.id,
              profiles: event.profiles || null,
              duration: { start: '00:00', end: '00:00' }
            };
          }

          // 文字列の場合
          if (typeof eventDuration === 'string') {
            // JSONかどうか判断（{で始まる場合のみパース試行）
            if (eventDuration.trim().startsWith('{')) {
              try {
                eventDuration = JSON.parse(eventDuration);
              } catch (e) {
                // JSONパースに失敗した場合は時間文字列として処理
                const durationStr = eventDuration as string;
                const hoursMatch = durationStr.match(/(\d+)時間/);
                const minutesMatch = durationStr.match(/(\d+)分/);
                
                const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
                const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
                
                // 時間が取得できた場合
                if (hours > 0 || minutes > 0) {
                  if (hours > 0 && minutes > 0) {
                    eventDuration = `${hours}時間${minutes}分`;
                  } else if (hours > 0) {
                    eventDuration = `${hours}時間`;
                  } else if (minutes > 0) {
                    eventDuration = `${minutes}分`;
                  }
                } else {
                  // 時間が取得できなかった場合はデフォルト値
                  eventDuration = { start: '00:00', end: '00:00' };
                }
              }
            } else {
              // JSONではない通常の時間文字列
              const durationStr = eventDuration as string;
              const hoursMatch = durationStr.match(/(\d+)時間/);
              const minutesMatch = durationStr.match(/(\d+)分/);
              
              const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
              const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
              
              // 時間が取得できなかった場合はデフォルト値
              if (hours === 0 && minutes === 0) {
                eventDuration = { start: '00:00', end: '00:00' };
              }
            }
          }
          
          // オブジェクトの場合、必要なフィールドの存在を確認
          if (typeof eventDuration === 'object' && (!('start' in eventDuration) || !('end' in eventDuration) || !eventDuration.start || !eventDuration.end)) {
            eventDuration = { start: '00:00', end: '00:00' };
          }

          return {
        ...event,
            isOwner: event.user_id === session.user.id,
            profiles: event.profiles || null,
            duration: eventDuration
          };
        });

      setEvents(processedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('予期せぬエラー:', error);
      setError('イベントの取得中に予期せぬエラーが発生しました');
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
          // durationがない場合はフィルタリングから除外
          if (!event.duration) return false;
          
          let durationStr = '';
          
          // durationが文字列の場合
          if (typeof event.duration === 'string') {
            try {
              // JSONとして解析を試みる
              const parsedDuration = JSON.parse(event.duration);
              if (parsedDuration && typeof parsedDuration === 'object' && parsedDuration.start && parsedDuration.end) {
                durationStr = `${parsedDuration.start}～${parsedDuration.end}`;
            } else {
                // 解析できたが適切なプロパティがない場合は元の文字列を使用
                durationStr = event.duration;
              }
            } catch (e) {
              // JSON解析に失敗した場合は元の文字列を使用
              durationStr = event.duration;
            }
          } 
          // durationがオブジェクトの場合
          else if (typeof event.duration === 'object' && event.duration !== null) {
            if (event.duration.start && event.duration.end) {
              durationStr = `${event.duration.start}～${event.duration.end}`;
            }
          }
          
          return durationStr.toLowerCase().includes(advancedFilters.duration.toLowerCase());
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
    const currentMonth = new Date().getMonth() + 1; // 1-12の値
    
    if (sortType === 'date') {
      // 月の登録順（今月を先頭に）
      filtered.sort((a, b) => {
        const monthA = Number(a.month) || 0;
        const monthB = Number(b.month) || 0;
        
        // 今月からの距離を計算
        const distanceA = (monthA - currentMonth + 12) % 12;
        const distanceB = (monthB - currentMonth + 12) % 12;
        
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
        
        // 同じ月の場合は登録日順（新しい順）
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      });
    } else if (sortType === 'popular') {
      // 人気順（閲覧数順）
      filtered.sort((a, b) => {
        const viewsA = a.views || 0;
        const viewsB = b.views || 0;
        
        if (viewsA !== viewsB) {
          return viewsB - viewsA;
        }
        
        // 閲覧数が同じ場合は登録日順
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, showAdvancedSearch, advancedFilters, sortType]);

  // イベントが変更されたときに画像を読み込む
  useEffect(() => {
    const loadEventImages = async () => {
      if (!filteredEvents.length) return;
      
      try {
        // セッションの確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('セッションエラー:', sessionError);
          return;
        }
        
        if (!session) {
          console.log('セッションがありません');
          return;
        }

        const newBlobUrls: Record<string, string> = { ...imageBlobUrls };
        let updated = false;

        // 表示される画像のみを先に読み込む（現在のページに表示されるイベントのみ）
        const visibleEvents = filteredEvents.slice(
          (currentPage - 1) * eventsPerPage, 
          currentPage * eventsPerPage
        );

        // 各イベントのメディアファイルを処理
        for (const event of visibleEvents) {
          if (event.media_files && event.media_files.length > 0) {
            const media = event.media_files[0]; // 最初の画像のみを処理
            
            // すでにBlobURLがある場合はスキップ
            const key = `${event.id}_0`;
            if (imageBlobUrls[key]) continue;
            
            if (media.type === 'image') {
              try {
                // URLからファイルパスを抽出する
                const urlObj = new URL(media.url);
                const pathSegments = urlObj.pathname.split('/');
                // "public"と"event-media"の後の部分を取得
                const bucketPath = pathSegments.slice(pathSegments.indexOf('event-media') + 1).join('/');
                
                if (!bucketPath) {
                  console.error(`イベント ${event.id} の画像パスが不正です:`, media.url);
                  continue;
                }
                
                // 直接バケットからデータを取得（サムネイル変換オプションを指定）
                const { data, error } = await supabase
                  .storage
                  .from('event-media')
                  .download(bucketPath, {
                    transform: {
                      width: 300,
                      height: 200,
                      resize: 'cover'
                    }
                  });
                
                if (error) {
                  console.error(`イベント ${event.id} の画像ダウンロードエラー:`, error);
                  
                  // 直接URLを使用してみる（フォールバック）
                  try {
                    const response = await fetch(media.url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    newBlobUrls[key] = blobUrl;
                    updated = true;
                    console.log(`イベント ${event.id} の画像を直接URLから取得しました`);
                  } catch (fetchError) {
                    console.error(`イベント ${event.id} の直接URL取得エラー:`, fetchError);
                  }
                  continue;
                }
                
                if (!data) {
                  console.error(`イベント ${event.id} の画像データが空です`);
                  continue;
                }
                
                // Blobを作成してURLを生成
                const blob = new Blob([data], { type: 'image/png' });
                const blobUrl = URL.createObjectURL(blob);
                newBlobUrls[key] = blobUrl;
                updated = true;
                console.log(`イベント ${event.id} の画像BlobURL作成成功`);
              } catch (error) {
                console.error(`イベント ${event.id} の画像処理エラー:`, error);
              }
            }
          }
        }

        if (updated) {
          setImageBlobUrls(newBlobUrls);
        }
      } catch (error) {
        console.error('画像読み込み中のエラー:', error);
      }
    };

    loadEventImages();
    
    // クリーンアップ関数
    return () => {
      // BlobURLの解放
      Object.values(imageBlobUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [filteredEvents]);

  // 検索クエリの変更を処理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 検索条件に一致するイベントをフィルタリング
    const filtered = events.filter(event => {
      // タイトルか説明文に検索語が含まれているかチェック
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const descMatch = event.description?.toLowerCase().includes(searchLower);
      
      return titleMatch || descMatch;
    });
    
    setFilteredEvents(filtered);
    setCurrentPage(1); // 検索時にページを1にリセット
  };

  // 詳細検索モーダルを開く
  const openAdvancedSearch = () => {
    setShowAdvancedSearch(true);
  };

  // 詳細検索モーダルを閉じる（キャンセル時）
  const closeAdvancedSearch = () => {
    setShowAdvancedSearch(false);
    // フィルターの状態は保持したまま閉じる（変更なし）
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
    const filtered = events.filter(event => {
      // タイトルフィルター
      if (advancedFilters.title && 
          !event.title?.toLowerCase().includes(advancedFilters.title.toLowerCase())) {
        return false;
      }
      
      // 説明文フィルター
      if (advancedFilters.description && 
          !event.description?.toLowerCase().includes(advancedFilters.description.toLowerCase())) {
        return false;
      }
      
      // カテゴリーフィルター
      if (advancedFilters.category && event.category !== advancedFilters.category) {
        return false;
      }
      
      // 年齢グループフィルター
      if (advancedFilters.ageGroups.length > 0) {
        // 選択された年齢グループのうち、少なくとも1つがイベントの年齢グループに含まれているか確認
        const hasMatchingAgeGroup = advancedFilters.ageGroups.some(age => 
          event.age_groups?.includes(age as AgeGroup)
        );
        if (!hasMatchingAgeGroup) {
          return false;
        }
      }
      
      // 画像ありフィルター
      if (advancedFilters.hasImage) {
        const hasImages = event.media_files?.some(file => file.type === 'image');
        if (!hasImages) {
          return false;
        }
      }
      
      // 動画ありフィルター
      if (advancedFilters.hasVideo) {
        const hasVideos = event.media_files?.some(file => file.type === 'video');
        if (!hasVideos) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredEvents(filtered);
    setCurrentPage(1); // 詳細検索適用時にページを1にリセット
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

  const handleEditEventSubmit = async (formData: EditFormData) => {
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
      const existingMediaFiles = formData.media_files.filter(file => !(file instanceof File) && !('file' in file)) as MediaFile[];
      
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

      // durationが文字列の場合はそのまま使用
      // durationがオブジェクトの場合は文字列に変換
      let durationStr = '';
      if (typeof formData.duration === 'object' && formData.duration) {
        const end = formData.duration.end;
        if (end) {
          const timeMatch = end.match(/^(\d{1,2}):(\d{1,2})$/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            
            if (hours > 0) {
              durationStr += `${hours}時間`;
            }
            
            if (minutes > 0) {
              durationStr += `${minutes}分`;
            }
          }
        }
      } else if (formData.duration) {
        durationStr = formData.duration.toString();
      }
      
      const { data, error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          category_detail: formData.category_detail,
          month: formData.month,
          date: formData.date,
          age_groups: formData.age_groups,
          duration: durationStr || '不明',
          materials: formData.materials,
          objectives: formData.objectives,
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

  const handleLogout = () => {
    try {
      // すべてのクッキーを削除
      document.cookie.split(";").forEach(c => {
        const key = c.trim().split("=")[0];
        if (key) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Supabase関連のローカルストレージをクリア
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // ページをリロード
      window.location.href = '/';
    } catch (error) {
      console.error('ログアウト処理エラー:', error);
      // エラーが発生しても強制的にホームページへ
      window.location.href = '/';
    }
  };

  // ソートの処理を行う関数
  const handleSort = (type: 'date' | 'popular') => {
    if (type === sortType) return;
    
    setSortType(type);
    setCurrentPage(1); // ソート時にページを1に戻す
    
    const currentMonth = new Date().getMonth() + 1; // 1-12の値

    const sorted = [...filteredEvents].sort((a, b) => {
    if (type === 'date') {
        // 月の登録順（今月を先頭に）
        const monthA = Number(a.month) || 0;
        const monthB = Number(b.month) || 0;
        
        // 今月からの距離を計算
        const distanceA = (monthA - currentMonth + 12) % 12;
        const distanceB = (monthB - currentMonth + 12) % 12;
        
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
        
        // 同じ月の場合は登録日順（新しい順）
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
    } else {
        // 人気順（閲覧数順）
        const viewsA = a.views || 0;
        const viewsB = b.views || 0;
        
        if (viewsA !== viewsB) {
        return viewsB - viewsA;
        }
        
        // 閲覧数が同じ場合は登録日順
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      }
    });
    
    setFilteredEvents(sorted);
  };

  // ページ変更を処理する関数
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // ページトップにスクロール
  };

  // 現在のページに表示するイベントを計算
  const currentEvents = filteredEvents.slice(
    (currentPage - 1) * eventsPerPage, 
    currentPage * eventsPerPage
  );

  // 全ページ数を計算
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  // ページネーションボタンを生成する関数
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5; // 表示するボタンの最大数
    
    // ページ数が少ない場合
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`${styles.pageButton} ${currentPage === i ? styles.active : ''}`}
          >
            {i}
          </button>
        );
      }
    } else {
      // 最初のページへのボタン
      if (currentPage > 1) {
        buttons.push(
          <button
            key="first"
            onClick={() => handlePageChange(1)}
            className={styles.pageButton}
          >
            ＜＜
          </button>
        );
      }
      
      // 前のページへのボタン
      if (currentPage > 1) {
        buttons.push(
          <button
            key="prev"
            onClick={() => handlePageChange(currentPage - 1)}
            className={styles.pageButton}
          >
            ＜
          </button>
        );
      }
      
      // ページ番号ボタン
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);
      
      // endPageが最大数より少ない場合は、startPageを調整
      if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`${styles.pageButton} ${currentPage === i ? styles.active : ''}`}
          >
            {i}
          </button>
        );
      }
      
      // 次のページへのボタン
      if (currentPage < totalPages) {
        buttons.push(
          <button
            key="next"
            onClick={() => handlePageChange(currentPage + 1)}
            className={styles.pageButton}
          >
            ＞
          </button>
        );
      }
      
      // 最後のページへのボタン
      if (currentPage < totalPages) {
        buttons.push(
          <button
            key="last"
            onClick={() => handlePageChange(totalPages)}
            className={styles.pageButton}
          >
            ＞＞
          </button>
        );
      }
    }
    
    return buttons;
  };

  // イベントカードのレンダリング部分
  const renderEventCard = (event: Event) => {
    // 月の値を取得
    const monthNumber = Number(event.month);
    let borderColor = '#ddd';
    let bgColor = 'white';
    
    // 月ごとに色を設定
    switch(monthNumber) {
      case 1: borderColor = '#FF6B6B'; bgColor = 'linear-gradient(135deg, #fff, #fff5f5)'; break;
      case 2: borderColor = '#4A90E2'; bgColor = 'linear-gradient(135deg, #fff, #f5f8ff)'; break;
      case 3: borderColor = '#FF9FB2'; bgColor = 'linear-gradient(135deg, #fff, #fff5f7)'; break;
      case 4: borderColor = '#7ED321'; bgColor = 'linear-gradient(135deg, #fff, #f7fff0)'; break;
      case 5: borderColor = '#4FD1C5'; bgColor = 'linear-gradient(135deg, #fff, #f0fffd)'; break;
      case 6: borderColor = '#9B6DFF'; bgColor = 'linear-gradient(135deg, #fff, #f8f5ff)'; break;
      case 7: borderColor = '#54C7FC'; bgColor = 'linear-gradient(135deg, #fff, #f0faff)'; break;
      case 8: borderColor = '#FFB347'; bgColor = 'linear-gradient(135deg, #fff, #fff7f0)'; break;
      case 9: borderColor = '#4CAF50'; bgColor = 'linear-gradient(135deg, #fff, #f0fff1)'; break;
      case 10: borderColor = '#FFB74D'; bgColor = 'linear-gradient(135deg, #fff, #fff8f0)'; break;
      case 11: borderColor = '#FF7043'; bgColor = 'linear-gradient(135deg, #fff, #fff5f0)'; break;
      case 12: borderColor = '#5C6BC0'; bgColor = 'linear-gradient(135deg, #fff, #f5f6ff)'; break;
    }
    
    const cardStyle = {
      borderColor: borderColor,
      background: bgColor
    };
    
    const monthTextStyle = {
      color: borderColor
    };
    
    // イベントのBlobURLキーを取得
    const blobUrlKey = `${event.id}_0`;
    const hasImage = event.media_files && event.media_files.length > 0 && event.media_files[0].type === 'image';
    const blobUrl = imageBlobUrls[blobUrlKey];
    
    return (
      <div 
        key={event.id}
        className={styles.eventCard}
        style={cardStyle}
        onClick={() => handleEventClick(event)}
      >
        <div className={styles.imageContainer}>
          {hasImage ? (
            blobUrl ? (
              <img 
                src={blobUrl} 
                alt={event.title} 
                className={styles.eventImage}
                loading="lazy"
                onError={(e) => {
                  console.log(`イベント ${event.id} のBlobURL画像読み込みエラー`);
                  e.currentTarget.style.display = 'none';
                  
                  // No Image表示に切り替え
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const noImageDiv = document.createElement('div');
                    noImageDiv.className = styles.noImage;
                    noImageDiv.textContent = 'No Image';
                    parent.appendChild(noImageDiv);
                  }
                }}
              />
            ) : (
              <div className={styles.noImage}>
                <span>読み込み中...</span>
                <div className={styles.loadingIndicator}></div>
              </div>
            )
          ) : (
            <div className={styles.noImage}>No Image</div>
          )}
        </div>
        
        <div style={{marginBottom: '12px'}}>
          <span 
            className={getCategoryStyle(event.category || 'その他')}
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 500,
              marginBottom: '8px'
            }}
          >
            {getCategoryDisplayText(event.category || 'その他')}
          </span>
          <h3 className={styles.title}>{event.title}</h3>
        </div>
        
        {event.description && (
          <div className={styles.eventDescription}>{event.description}</div>
        )}
        
        <div className={styles.ageGroups}>
          {event.age_groups && 
            [...event.age_groups].sort((a, b) => {
              const order = ['0歳児', '1歳児', '2歳児', '3歳児', '4歳児', '5歳児'];
              return order.indexOf(a) - order.indexOf(b);
            }).map(age => (
              <span key={age} className={`${styles.ageGroup} ${getAgeGroupStyle(age)}`}>{age}</span>
            ))
          }
        </div>
        
        <div className={styles.eventFooter}>
          <div className={styles.month} style={monthTextStyle}>{event.month}月</div>
          <div className={styles.duration}>所要時間: {formatDuration(event.duration)}</div>
        </div>
      </div>
    );
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
          {currentEvents.map(renderEventCard)}
        </div>
        
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.resultsCount}>
              全{filteredEvents.length}件中 {(currentPage - 1) * eventsPerPage + 1}～
              {Math.min(currentPage * eventsPerPage, filteredEvents.length)}件を表示
        </div>
            <div className={styles.pagination}>
              {renderPaginationButtons()}
            </div>
          </div>
        )}
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
                category_detail: editingEvent.category_detail,
                month: editingEvent.month,
                date: editingEvent.date,
                duration: editingEvent.duration,
                materials: editingEvent.materials || [],
                objectives: editingEvent.objectives || [],
                age_groups: editingEvent.age_groups,
                media_files: editingEvent.media_files || []
              }}
              onSubmit={handleEditEventSubmit}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}

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