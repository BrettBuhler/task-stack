'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { requestNotificationPermission, getNotificationPermissionState } from '@/lib/notifications';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Navbar() {
  const pathname = usePathname();
  const [notifPerm, setNotifPerm] = useState<string>('default');

  useEffect(() => {
    setNotifPerm(getNotificationPermissionState());
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPerm(granted ? 'granted' : 'denied');
    if (granted) {
      toast.success('Notifications enabled');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const navLinks = [
    { href: '/', label: 'Stack' },
    { href: '/markdown', label: 'Markdown' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#06060e]/80 backdrop-blur-xl">
      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cyan-400">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">
            Task Stack
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-white/[0.06] text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
            <button
              onClick={handleEnableNotifications}
              className="ml-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all duration-200 hover:border-cyan-500/20 hover:text-cyan-400"
            >
              Notifications
            </button>
          )}

          {/* User avatar placeholder - auth agent will wire this up */}
          <div className="ml-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition-all duration-200 hover:border-cyan-500/20 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}
