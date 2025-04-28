'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import EditEventForm from '../../../components/EditEventForm';
import type { Event, EventFormData, MediaFile } from '../../../types/event';
import { Metadata } from 'next';

// 編集フォームからのデータを受け取るための型
type EditFormData = Omit<EventFormData, 'media_files'> & {
  media_files: (MediaFile | File)[];
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const convertEventToFormData = (event: Event): EventFormData => {
  return {
    title: event.title,
    description: event.description,
    category: event.category,
    month: event.month,
    date: event.date,
    duration: event.duration,
    materials: event.materials,
    objectives: event.objectives,
    age_groups: event.age_groups,
    media_files: event.media_files,
    ...(event.id ? { id: event.id } : {})
  };
};

type Props = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function EditEventPage({ params }: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/');
          return;
        }

        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', session.user.id)
          .single();

        if (eventError) {
          if (eventError.code === 'PGRST116') {
            setError('イベントが見つかりませんでした');
          } else {
            setError(`データの取得中にエラーが発生しました: ${eventError.message}`);
          }
          return;
        }

        if (!eventData) {
          setError('イベントが見つかりませんでした');
          return;
        }

        setEvent(eventData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
        setError(`予期せぬエラーが発生しました: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id, router]);

  const handleSubmit = async (formData: EditFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      // durationが文字列の場合はそのまま使用
      // durationがオブジェクトの場合は文字列に変換
      let durationStr = '';
      if (typeof formData.duration === 'object') {
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
      } else {
        durationStr = formData.duration;
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          month: formData.month,
          date: formData.date,
          age_groups: formData.age_groups,
          duration: durationStr || '不明',
          materials: formData.materials,
          objectives: formData.objectives,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', session.user.id);

      if (error) throw error;
      router.push('/events');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
      setError(`更新中にエラーが発生しました: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <EditEventForm
      data={convertEventToFormData(event)}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/events')}
    />
  );
} 