import { Task } from './types';
import { format } from 'date-fns';

export function generateMarkdown(tasks: Task[]): string {
  const grouped = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const lines: string[] = ['# Task Stack', ''];

  if (grouped.todo.length > 0) {
    lines.push('## Todo', '');
    for (const task of grouped.todo) {
      lines.push(formatTask(task, false));
    }
    lines.push('');
  }

  if (grouped.in_progress.length > 0) {
    lines.push('## In Progress', '');
    for (const task of grouped.in_progress) {
      lines.push(formatTask(task, false));
    }
    lines.push('');
  }

  if (grouped.done.length > 0) {
    lines.push('## Done', '');
    for (const task of grouped.done) {
      lines.push(formatTask(task, true));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatTask(task: Task, checked: boolean): string {
  const checkbox = checked ? '- [x]' : '- [ ]';
  let line = `${checkbox} **${task.title}**`;

  if (task.description) {
    line += `\n  ${task.description}`;
  }

  if (task.follow_ups && task.follow_ups.length > 0) {
    for (const fu of task.follow_ups) {
      const dateStr = format(new Date(fu.due_date), 'MMM d, yyyy h:mm a');
      const status = fu.notified ? '(notified)' : '(pending)';
      line += `\n  - Follow-up: ${fu.title} — ${dateStr} ${status}`;
    }
  }

  return line;
}
