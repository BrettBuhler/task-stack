'use client';

import { FollowUp } from '@/lib/types';
import { format, isPast } from 'date-fns';

interface FollowUpBadgeProps {
  followUp: FollowUp;
}

export default function FollowUpBadge({ followUp }: FollowUpBadgeProps) {
  const dueDate = new Date(followUp.due_date);
  const overdue = isPast(dueDate) && !followUp.notified;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-200 ${
        followUp.notified
          ? 'border-zinc-500/10 bg-zinc-500/5 text-zinc-500'
          : overdue
            ? 'border-red-500/20 bg-red-500/10 text-red-400 animate-pulse'
            : 'border-purple-500/20 bg-purple-500/10 text-purple-400'
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {followUp.title} — {format(dueDate, 'MMM d, h:mm a')}
    </span>
  );
}
