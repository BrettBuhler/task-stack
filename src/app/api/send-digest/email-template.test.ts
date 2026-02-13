import { describe, it, expect } from 'vitest';
import { buildDigestEmail } from './email-template';

describe('buildDigestEmail', () => {
  it('includes a personalized greeting when userName is provided', () => {
    const html = buildDigestEmail({ tasks: [], followUps: [], userName: 'Alice' });
    expect(html).toContain('Hey Alice');
  });

  it('uses a generic greeting when userName is not provided', () => {
    const html = buildDigestEmail({ tasks: [], followUps: [] });
    expect(html).toContain('Hey there');
  });

  it('renders In Progress and To Do sections', () => {
    const html = buildDigestEmail({
      tasks: [
        { id: '1', title: 'Task A', description: '', status: 'in_progress', priority: 0 },
        { id: '2', title: 'Task B', description: '', status: 'todo', priority: 0 },
      ],
      followUps: [],
    });
    expect(html).toContain('In Progress');
    expect(html).toContain('To Do');
    expect(html).toContain('Task A');
    expect(html).toContain('Task B');
  });

  it('renders priority dots for tasks with priority > 0', () => {
    const html = buildDigestEmail({
      tasks: [
        { id: '1', title: 'High prio', description: '', status: 'todo', priority: 2 },
      ],
      followUps: [],
    });
    // Should have 2 priority dot spans
    const dotMatches = html.match(/border-radius:50%;background:#f59e0b/g);
    expect(dotMatches).toHaveLength(2);
  });

  it('truncates long descriptions to 80 chars', () => {
    const longDesc = 'A'.repeat(100);
    const html = buildDigestEmail({
      tasks: [
        { id: '1', title: 'Test', description: longDesc, status: 'todo', priority: 0 },
      ],
      followUps: [],
    });
    expect(html).toContain('A'.repeat(80) + '...');
    expect(html).not.toContain('A'.repeat(100));
  });

  it('renders follow-ups section with due dates', () => {
    const html = buildDigestEmail({
      tasks: [],
      followUps: [
        { id: 'f1', title: 'Follow up X', due_date: '2025-06-15T14:00:00.000Z', task_title: 'Parent Task' },
      ],
    });
    expect(html).toContain('Upcoming Follow-ups');
    expect(html).toContain('Follow up X');
    expect(html).toContain('Parent Task');
  });

  it('renders empty state when no tasks and no follow-ups', () => {
    const html = buildDigestEmail({ tasks: [], followUps: [] });
    expect(html).toContain('All clear!');
  });
});
