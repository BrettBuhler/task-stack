'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTasks } from '@/hooks/useTasks';
import { generateMarkdown } from '@/lib/markdown';
import { toast } from 'sonner';

export default function MarkdownExport() {
  const { tasks, loading } = useTasks();
  const [showPreview, setShowPreview] = useState(true);

  const markdown = generateMarkdown(tasks);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <button
            onClick={() => setShowPreview(true)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              showPreview
                ? 'bg-white/[0.06] text-cyan-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setShowPreview(false)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              !showPreview
                ? 'bg-white/[0.06] text-cyan-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Raw
          </button>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-cyan-500/20 hover:text-cyan-400 hover:shadow-[0_0_12px_rgba(0,240,255,0.06)]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        {showPreview ? (
          <div className="p-6 prose prose-invert prose-sm max-w-none prose-headings:text-cyan-400 prose-headings:font-medium prose-strong:text-zinc-200 prose-li:text-zinc-300 prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-3 right-3 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              markdown
            </div>
            <pre className="overflow-x-auto p-6 text-xs leading-relaxed text-zinc-300 font-mono">
              <code>{markdown}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
