import MarkdownExport from "@/components/MarkdownExport";

export const dynamic = 'force-dynamic';

export default function MarkdownPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-purple-200 to-purple-400 bg-clip-text text-transparent">
          Markdown Export
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          All tasks as a markdown checklist.
        </p>
      </div>
      <MarkdownExport />
    </div>
  );
}
