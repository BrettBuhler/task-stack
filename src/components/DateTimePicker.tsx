'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addHours,
  addDays,
  nextMonday,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  parseISO,
} from 'date-fns';

interface DateTimePickerProps {
  value: string;
  onChange: (isoString: string) => void;
  ariaLabelledBy?: string;
}

function parseTimeString(raw: string): { hours: number; minutes: number } | null {
  const trimmed = raw.trim().toLowerCase();

  // Match "3:30 pm", "3:30pm", "15:30", "3 pm", "3pm"
  const match = trimmed.match(
    /^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/
  );
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3];

  if (minutes < 0 || minutes > 59) return null;

  if (period) {
    // 12-hour format
    if (hours < 1 || hours > 12) return null;
    if (period === 'am' && hours === 12) hours = 0;
    else if (period === 'pm' && hours !== 12) hours += 12;
  } else {
    // 24-hour format
    if (hours < 0 || hours > 23) return null;
  }

  return { hours, minutes };
}

export default function DateTimePicker({ value, onChange, ariaLabelledBy }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(selected ?? new Date());

  // Time state derived from selected or defaults
  const currentHours = selected ? selected.getHours() : 9;
  const currentMinutes = selected ? selected.getMinutes() : 0;

  const display12 = currentHours % 12 || 12;
  const displayAmPm: 'AM' | 'PM' = currentHours < 12 ? 'AM' : 'PM';

  const [hourText, setHourText] = useState(String(display12));
  const [minuteText, setMinuteText] = useState(String(currentMinutes).padStart(2, '0'));
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(displayAmPm);
  const [freeText, setFreeText] = useState('');
  const [freeTextMode, setFreeTextMode] = useState(false);

  // Sync internal time fields when value prop changes
  useEffect(() => {
    if (selected) {
      const h = selected.getHours();
      const m = selected.getMinutes();
      setHourText(String(h % 12 || 12));
      setMinuteText(String(m).padStart(2, '0'));
      setAmpm(h < 12 ? 'AM' : 'PM');
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const buildDate = useCallback(
    (day: Date, hours: number, minutes: number) => {
      let d = new Date(day);
      d = setHours(d, hours);
      d = setMinutes(d, minutes);
      d.setSeconds(0, 0);
      return d.toISOString();
    },
    []
  );

  const resolveTime = useCallback((): { hours: number; minutes: number } => {
    let h = parseInt(hourText, 10) || 12;
    const m = parseInt(minuteText, 10) || 0;
    if (h < 1) h = 12;
    if (h > 12) h = 12;
    if (ampm === 'AM' && h === 12) h = 0;
    else if (ampm === 'PM' && h !== 12) h += 12;
    return { hours: h, minutes: Math.min(59, Math.max(0, m)) };
  }, [hourText, minuteText, ampm]);

  const handleDayClick = (day: Date) => {
    const { hours, minutes } = resolveTime();
    onChange(buildDate(day, hours, minutes));
  };

  const handleTimeCommit = () => {
    if (!selected) return;
    const { hours, minutes } = resolveTime();
    onChange(buildDate(selected, hours, minutes));
  };

  const handleFreeTextCommit = () => {
    const parsed = parseTimeString(freeText);
    if (!parsed) return;
    const base = selected ?? new Date();
    onChange(buildDate(base, parsed.hours, parsed.minutes));
    setFreeText('');
    setFreeTextMode(false);
  };

  // Presets
  const presets = [
    {
      label: 'In 1 hour',
      apply: () => {
        const d = addHours(new Date(), 1);
        d.setSeconds(0, 0);
        onChange(d.toISOString());
        setViewMonth(d);
      },
    },
    {
      label: 'In 3 hours',
      apply: () => {
        const d = addHours(new Date(), 3);
        d.setSeconds(0, 0);
        onChange(d.toISOString());
        setViewMonth(d);
      },
    },
    {
      label: 'Tomorrow 9 AM',
      apply: () => {
        let d = addDays(new Date(), 1);
        d = setHours(d, 9);
        d = setMinutes(d, 0);
        d.setSeconds(0, 0);
        onChange(d.toISOString());
        setViewMonth(d);
      },
    },
    {
      label: 'Next Mon 9 AM',
      apply: () => {
        let d = nextMonday(new Date());
        d = setHours(d, 9);
        d = setMinutes(d, 0);
        d.setSeconds(0, 0);
        onChange(d.toISOString());
        setViewMonth(d);
      },
    },
  ];

  // Calendar grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const displayValue = selected
    ? format(selected, "MMM d, yyyy 'at' h:mm a")
    : '';

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-labelledby={ariaLabelledBy}
        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
          open
            ? 'border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.08)]'
            : 'border-white/10 hover:border-white/20'
        } bg-white/5 ${selected ? 'text-zinc-100' : 'text-zinc-500'}`}
      >
        {displayValue || 'Pick date & time...'}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-white/10 bg-[#0a0a1a] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Presets */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.apply}
                className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-all hover:bg-cyan-500/10 hover:text-cyan-400"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-xs font-medium text-zinc-300">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="py-1 text-[10px] font-medium text-zinc-500">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="mb-3 grid grid-cols-7">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`flex h-8 w-full items-center justify-center rounded-md text-xs transition-all ${
                    !inMonth
                      ? 'text-zinc-700'
                      : isSelected
                        ? 'bg-cyan-500/20 font-semibold text-cyan-400'
                        : 'text-zinc-300 hover:bg-cyan-500/10'
                  } ${today && !isSelected ? 'ring-1 ring-cyan-500/30' : ''}`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="mb-3 border-t border-white/5" />

          {/* Time section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">Time</span>
              <button
                type="button"
                onClick={() => setFreeTextMode(!freeTextMode)}
                className="text-[10px] text-cyan-500/70 transition-colors hover:text-cyan-400"
              >
                {freeTextMode ? 'Use fields' : 'Type time'}
              </button>
            </div>

            {freeTextMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFreeTextCommit();
                    }
                  }}
                  placeholder='e.g. "3:30 PM" or "15:30"'
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={handleFreeTextCommit}
                  className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium text-cyan-400 transition-all hover:bg-cyan-500/20"
                >
                  Set
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hourText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setHourText(v);
                  }}
                  onBlur={handleTimeCommit}
                  className="w-10 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-zinc-100 outline-none transition-colors focus:border-cyan-500/30"
                  placeholder="12"
                />
                <span className="text-zinc-500">:</span>
                <input
                  type="text"
                  value={minuteText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setMinuteText(v);
                  }}
                  onBlur={handleTimeCommit}
                  className="w-10 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-zinc-100 outline-none transition-colors focus:border-cyan-500/30"
                  placeholder="00"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newAmpm = ampm === 'AM' ? 'PM' : 'AM';
                    setAmpm(newAmpm);
                    // Commit with the new value directly since setState is async
                    if (selected) {
                      let h = parseInt(hourText, 10) || 12;
                      const m = parseInt(minuteText, 10) || 0;
                      if (h < 1) h = 12;
                      if (h > 12) h = 12;
                      if (newAmpm === 'AM' && h === 12) h = 0;
                      else if (newAmpm === 'PM' && h !== 12) h += 12;
                      onChange(buildDate(selected, h, Math.min(59, Math.max(0, m))));
                    }
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-cyan-500/20 hover:text-cyan-400"
                >
                  {ampm}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
