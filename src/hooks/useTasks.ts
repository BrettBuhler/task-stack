'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/types';

function isMissingUserIdColumnError(error: { message?: string | null; details?: string | null }) {
  const combined = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return combined.includes('user_id') && (combined.includes('column') || combined.includes('schema cache'));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, follow_ups(*)')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
      return;
    }
    setTasks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order), -1);
      const baseInsert = { ...input, sort_order: maxOrder + 1 };
      const insertWithUser = userId ? { ...baseInsert, user_id: userId } : baseInsert;

      if (!userId) {
        console.error('Warning creating task: missing authenticated user session');
      }

      let { data, error } = await supabase
        .from('tasks')
        .insert(insertWithUser)
        .select('*, follow_ups(*)')
        .single();

      if (error && userId && isMissingUserIdColumnError(error)) {
        ({ data, error } = await supabase
          .from('tasks')
          .insert(baseInsert)
          .select('*, follow_ups(*)')
          .single());
      }

      if (error) {
        console.error('Error creating task:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }
      setTasks((prev) => [...prev, data]);
      return data;
    },
    [tasks]
  );

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select('*, follow_ups(*)')
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  const reorderTasks = useCallback(
    async (reorderedTasks: Task[]) => {
      // Optimistic update
      setTasks(reorderedTasks);

      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index,
      }));

      // Batch update sort_order in Supabase
      for (const update of updates) {
        const { error } = await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) {
          console.error('Error reordering task:', error);
          // Refetch on error to restore correct state
          fetchTasks();
          return;
        }
      }
    },
    [fetchTasks]
  );

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  };
}
