'use client';

import { useState } from 'react';
import DateTimePicker from './DateTimePicker';

interface FollowUpFormProps {
  taskId: string;
  onSubmit: (input: { task_id: string; title: string; due_date: string }) => void;
  onCancel: () => void;
}

export default function FollowUpForm({ taskId, onSubmit, onCancel }: FollowUpFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    onSubmit({
      task_id: taskId,
      title: title.trim(),
      due_date: dueDate,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-overlay-in bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a1a]/95 p-6 shadow-[0_0_40px_rgba(168,85,247,0.1)]"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-sm font-medium text-zinc-200">Add Follow-Up</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Follow-up title..."
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-purple-500/30 focus:shadow-[0_0_12px_rgba(168,85,247,0.06)]"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Due Date</label>
            <DateTimePicker value={dueDate} onChange={setDueDate} />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !dueDate}
              className="rounded-lg bg-purple-500/15 px-5 py-2 text-xs font-medium text-purple-400 transition-all duration-200 hover:bg-purple-500/25 hover:shadow-[0_0_12px_rgba(168,85,247,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              Add Follow-Up
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-white/[0.04] px-5 py-2 text-xs text-zinc-400 transition-all duration-200 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
