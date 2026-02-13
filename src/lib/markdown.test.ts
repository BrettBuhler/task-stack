import { describe, it, expect } from 'vitest';
import { generateMarkdown } from './markdown';
import { Task } from './types';
import { mockTasks, mockFollowUp, mockFollowUpNotified } from '@/__tests__/mocks/fixtures';

describe('generateMarkdown', () => {
  it('groups tasks by status with correct headers', () => {
    const md = generateMarkdown(mockTasks);
    expect(md).toContain('## Todo');
    expect(md).toContain('## In Progress');
    expect(md).toContain('## Done');
  });

  it('renders unchecked checkboxes for todo/in_progress and checked for done', () => {
    const md = generateMarkdown(mockTasks);
    expect(md).toContain('- [ ] **Build feature A**');
    expect(md).toContain('- [ ] **Fix bug B**');
    expect(md).toContain('- [x] **Deploy v1**');
  });

  it('includes task descriptions', () => {
    const md = generateMarkdown(mockTasks);
    expect(md).toContain('Implement the new feature');
    expect(md).toContain('Ship it');
  });

  it('includes follow-ups with formatted dates and status', () => {
    const tasksWithFollowUps: Task[] = [
      {
        ...mockTasks[0],
        follow_ups: [mockFollowUp, mockFollowUpNotified],
      },
    ];
    const md = generateMarkdown(tasksWithFollowUps);
    expect(md).toContain('Follow-up: Check status');
    expect(md).toContain('(pending)');
    expect(md).toContain('Follow-up: Already checked');
    expect(md).toContain('(notified)');
  });

  it('returns only the header for an empty array', () => {
    const md = generateMarkdown([]);
    expect(md).toBe('# Task Stack\n');
  });

  it('omits sections with no tasks of that status', () => {
    const todoOnly: Task[] = [mockTasks[0]];
    const md = generateMarkdown(todoOnly);
    expect(md).toContain('## Todo');
    expect(md).not.toContain('## In Progress');
    expect(md).not.toContain('## Done');
  });
});
