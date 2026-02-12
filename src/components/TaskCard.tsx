'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '@/lib/types';
import FollowUpBadge from './FollowUpBadge';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: { title?: string; description?: string; status?: TaskStatus }) => void;
  onDelete: (id: string) => void;
  onAddFollowUp: (taskId: string) => void;
}

const statusConfig: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  todo: {
    bg: 'bg-zinc-500/10 border-zinc-500/20',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
  },
  in_progress: {
    bg: 'bg-purple-500/10 border-purple-500/20',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
  },
  done: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

const statusCycle: TaskStatus[] = ['todo', 'in_progress', 'done'];

export default function TaskCard({ task, onUpdate, onDelete, onAddFollowUp }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cycleStatus = () => {
    const currentIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    onUpdate(task.id, { status: nextStatus });
  };

  const saveEdit = () => {
    onUpdate(task.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setIsEditing(false);
  };

  const config = statusConfig[task.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border bg-white/[0.03] backdrop-blur-xl transition-all duration-200 ${
        isDragging
          ? 'z-50 border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] scale-[1.02]'
          : 'border-white/[0.06] hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.08)]'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab px-1 py-3 text-zinc-700 opacity-0 transition-all duration-200 group-hover:opacity-100 active:cursor-grabbing hover:text-zinc-500"
      >
        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
          <circle cx="3" cy="4" r="1.5" />
          <circle cx="9" cy="4" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="3" cy="16" r="1.5" />
          <circle cx="9" cy="16" r="1.5" />
        </svg>
      </div>

      <div className="ml-6 p-4">
        {isEditing ? (
          <div className="space-y-3 animate-expand-in">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 outline-none transition-all duration-200 focus:border-cyan-500/30 focus:shadow-[0_0_12px_rgba(0,240,255,0.06)]"
              autoFocus
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-300 outline-none transition-all duration-200 focus:border-cyan-500/30 focus:shadow-[0_0_12px_rgba(0,240,255,0.06)]"
              rows={2}
              placeholder="Description..."
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="rounded-lg bg-cyan-500/15 px-4 py-1.5 text-xs font-medium text-cyan-400 transition-all duration-200 hover:bg-cyan-500/25"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-lg bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-400 transition-all duration-200 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-medium leading-relaxed ${
                    task.status === 'done' ? 'text-zinc-600 line-through' : 'text-zinc-200'
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{task.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {/* Status pill */}
                <button
                  onClick={cycleStatus}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide transition-all duration-200 hover:brightness-125 ${config.bg} ${config.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                  {statusLabels[task.status]}
                </button>

                {/* Action buttons */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg p-1.5 text-zinc-600 transition-all duration-200 hover:bg-white/[0.05] hover:text-zinc-300"
                  title="Edit"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => onAddFollowUp(task.id)}
                  className="rounded-lg p-1.5 text-zinc-600 transition-all duration-200 hover:bg-white/[0.05] hover:text-purple-400"
                  title="Add follow-up"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="rounded-lg p-1.5 text-zinc-600 transition-all duration-200 hover:bg-white/[0.05] hover:text-red-400"
                  title="Delete"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            {task.follow_ups && task.follow_ups.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {task.follow_ups.map((fu) => (
                  <FollowUpBadge key={fu.id} followUp={fu} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
