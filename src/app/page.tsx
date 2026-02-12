import TaskStack from "@/components/TaskStack";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
          Task Stack
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Drag to reorder. Click status to cycle.
        </p>
      </div>
      <TaskStack />
    </div>
  );
}
