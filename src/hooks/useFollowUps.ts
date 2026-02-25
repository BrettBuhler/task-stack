'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FollowUp, CreateFollowUpInput } from '@/lib/types';
import { sendBrowserNotification } from '@/lib/notifications';
import { toast } from 'sonner';

const POLL_INTERVAL = 30_000; // 30 seconds

function isMissingUserIdColumnError(error: { message?: string | null; details?: string | null }) {
  const combined = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return combined.includes('user_id') && (combined.includes('column') || combined.includes('schema cache'));
}

export function useFollowUps(onFollowUpNotified?: () => void) {
  const [dueFollowUps, setDueFollowUps] = useState<FollowUp[]>([]);

  const checkDueFollowUps = useCallback(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, tasks:task_id(title)')
      .eq('notified', false)
      .lte('due_date', now);

    if (error) {
      console.error('Error checking follow-ups:', error);
      return;
    }

    if (!data || data.length === 0) return;

    for (const followUp of data) {
      const taskTitle = (followUp as Record<string, unknown>).tasks
        ? ((followUp as Record<string, unknown>).tasks as { title: string }).title
        : 'Unknown Task';

      // Show toast
      toast('Follow-up Due', {
        description: `${followUp.title} — ${taskTitle}`,
        duration: 10000,
      });

      // Browser notification
      sendBrowserNotification(
        'Follow-up Due',
        `${followUp.title} — ${taskTitle}`
      );

      // Mark as notified
      await supabase
        .from('follow_ups')
        .update({ notified: true })
        .eq('id', followUp.id);
    }

    setDueFollowUps(data);
    onFollowUpNotified?.();
  }, [onFollowUpNotified]);

  useEffect(() => {
    checkDueFollowUps();
    const interval = setInterval(checkDueFollowUps, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkDueFollowUps]);

  const createFollowUp = useCallback(async (input: CreateFollowUpInput) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const baseInsert = { ...input };
    const insertWithUser = userId ? { ...baseInsert, user_id: userId } : baseInsert;

    if (!userId) {
      console.error('Warning creating follow-up: missing authenticated user session');
    }

    let { data, error } = await supabase
      .from('follow_ups')
      .insert(insertWithUser)
      .select()
      .single();

    if (error && userId && isMissingUserIdColumnError(error)) {
      ({ data, error } = await supabase
        .from('follow_ups')
        .insert(baseInsert)
        .select()
        .single());
    }

    if (error) {
      console.error('Error creating follow-up:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }
    return data as FollowUp;
  }, []);

  const deleteFollowUp = useCallback(async (id: string) => {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id);
    if (error) {
      console.error('Error deleting follow-up:', error);
      return false;
    }
    return true;
  }, []);

  return {
    dueFollowUps,
    createFollowUp,
    deleteFollowUp,
    checkNow: checkDueFollowUps,
  };
}
