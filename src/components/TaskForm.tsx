'use client';

import { useState } from 'react';
import { CreateTaskInput } from '@/lib/types';

interface TaskFormProps {
  onSubmit: (input: CreateTaskInput) => void;
}

export default function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    setIsExpanded(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border bg-white/[0.03] backdrop-blur-xl transition-all duration-300 ${
        isExpanded
          ? 'border-cyan-500/20 shadow-[0_0_20px_rgba(0,240,255,0.06)]'
          : 'border-white/[0.06] hover:border-white/[0.1]'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-5 w-5 items-center justify-center rounded-md transition-all duration-200 ${
            isExpanded ? 'text-cyan-400' : 'text-zinc-600'
          }`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Add a new task..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="animate-expand-in border-t border-white/[0.04] px-4 pb-4 pt-3">
          <div className="space-y-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition-all duration-200 focus:border-cyan-500/20 focus:shadow-[0_0_12px_rgba(0,240,255,0.04)]"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!title.trim()}
                className="rounded-lg bg-cyan-500/15 px-5 py-2 text-xs font-medium text-cyan-400 transition-all duration-200 hover:bg-cyan-500/25 hover:shadow-[0_0_12px_rgba(0,240,255,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                  setDescription('');
                }}
                className="rounded-lg bg-white/[0.04] px-5 py-2 text-xs text-zinc-400 transition-all duration-200 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
