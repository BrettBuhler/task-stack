'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { EmailPreferences } from '@/lib/types';

type Frequency = EmailPreferences['frequency'];

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [customCron, setCustomCron] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function load() {
      const authClient = createAuthClient();
      const { data: { user } } = await authClient.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email ?? '');

      const { data } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setEnabled(data.enabled);
        setFrequency(data.frequency);
        setCustomCron(data.custom_cron ?? '');
      }

      setLoading(false);
    }

    load();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    const authClient = createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('email_preferences')
      .upsert(
        {
          user_id: user.id,
          enabled,
          frequency,
          custom_cron: frequency === 'custom' ? customCron : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    setSaving(false);

    if (error) {
      setSaveMessage('Failed to save preferences');
    } else {
      setSaveMessage('Preferences saved');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleLogout = async () => {
    const authClient = createAuthClient();
    await authClient.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cyan-400">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your account and notification preferences
        </p>
      </div>

      {/* Account section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
          Account
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-300">{email}</p>
            <p className="mt-0.5 text-xs text-zinc-600">Signed in via email</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/20"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Email notification preferences */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-400">
          Email Notifications
        </h2>

        <div className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Email digest</p>
              <p className="mt-0.5 text-xs text-zinc-600">
                Receive a summary of your tasks and follow-ups
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
                enabled
                  ? 'border-cyan-500/50 bg-cyan-500/30'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg transition-transform ${
                  enabled
                    ? 'translate-x-5 bg-cyan-400'
                    : 'translate-x-0 bg-zinc-500'
                }`}
              />
            </button>
          </div>

          {/* Frequency selector */}
          {enabled && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Frequency
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['daily', 'weekly', 'monthly', 'custom'] as Frequency[]).map(
                  (freq) => (
                    <button
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      className={`rounded-lg border px-3 py-2 text-sm capitalize transition-all ${
                        frequency === freq
                          ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
                      }`}
                    >
                      {freq}
                    </button>
                  )
                )}
              </div>

              {frequency === 'custom' && (
                <div>
                  <label
                    htmlFor="customCron"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
                    Cron expression
                  </label>
                  <input
                    id="customCron"
                    type="text"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="0 9 * * 1"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
                  />
                  <p className="mt-1 text-xs text-zinc-600">
                    e.g. &quot;0 9 * * 1&quot; = every Monday at 9 AM
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:border-cyan-500/60 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
            {saveMessage && (
              <span
                className={`text-sm ${
                  saveMessage.includes('Failed')
                    ? 'text-red-400'
                    : 'text-green-400'
                }`}
              >
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
