'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { useFollowUps } from '@/hooks/useFollowUps';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import FollowUpForm from './FollowUpForm';
import FollowUpChecker from './FollowUpChecker';
import { CreateTaskInput, TaskStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function TaskStack() {
  const { tasks, loading, createTask, updateTask, deleteTask, reorderTasks, refetch } = useTasks();
  const { createFollowUp } = useFollowUps(refetch);
  const [followUpTaskId, setFollowUpTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    reorderTasks(reordered);
  };

  const handleCreate = async (input: CreateTaskInput) => {
    const result = await createTask(input);
    if (result) {
      toast.success('Task created');
    } else {
      toast.error('Failed to create task');
    }
  };

  const handleUpdate = async (id: string, updates: { title?: string; description?: string; status?: TaskStatus }) => {
    await updateTask(id, updates);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTask(id);
    if (result) {
      toast.success('Task deleted');
    } else {
      toast.error('Failed to delete task');
    }
  };

  const handleAddFollowUp = async (input: { task_id: string; title: string; due_date: string }) => {
    const result = await createFollowUp(input);
    if (result) {
      toast.success('Follow-up added');
      setFollowUpTaskId(null);
      refetch();
    } else {
      toast.error('Failed to add follow-up');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton for task form */}
        <div className="skeleton h-14 w-full" />
        {/* Skeleton for task cards */}
        <div className="space-y-2">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <FollowUpChecker onNotified={refetch} />
      <div className="space-y-4">
        <TaskForm onSubmit={handleCreate} />

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-500">No tasks yet</p>
            <p className="mt-1 text-xs text-zinc-600">Create your first task to get started</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAddFollowUp={(taskId) => setFollowUpTaskId(taskId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {followUpTaskId && (
        <FollowUpForm
          taskId={followUpTaskId}
          onSubmit={handleAddFollowUp}
          onCancel={() => setFollowUpTaskId(null)}
        />
      )}
    </>
  );
}
