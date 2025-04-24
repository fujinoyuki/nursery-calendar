'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import EditEventForm from '../../../components/EditEventForm';
import type { Event, EventFormData, LocalEventFormData } from '../../../types';
import { Metadata } from 'next';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const convertEventToFormData = (event: Event): EventFormData => {
  return {
    title: event.title || '',
    description: event.description || '',
    age_groups: event.age_groups || [],
    category: event.category || 'その他',
    materials: event.materials || [],
    objectives: event.objectives || [],
    month: event.month || new Date().getMonth() + 1,
    duration: event.duration || '',
    media_files: []
  };
};

interface PageProps {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function EditEventPage({ params, searchParams }: PageProps) {
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

  const handleSubmit = async (formData: LocalEventFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          age_groups: formData.age_groups,
          duration: formData.duration,
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