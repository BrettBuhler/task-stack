import { Task, FollowUp } from '@/lib/types';

export const mockFollowUp: FollowUp = {
  id: 'fu-1',
  task_id: 'task-1',
  user_id: 'user-1',
  title: 'Check status',
  due_date: '2025-06-15T14:00:00.000Z',
  notified: false,
  created_at: '2025-06-01T10:00:00.000Z',
};

export const mockFollowUpNotified: FollowUp = {
  id: 'fu-2',
  task_id: 'task-1',
  user_id: 'user-1',
  title: 'Already checked',
  due_date: '2025-05-01T10:00:00.000Z',
  notified: true,
  created_at: '2025-04-01T10:00:00.000Z',
};

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Build feature A',
    description: 'Implement the new feature',
    status: 'todo',
    priority: 2,
    sort_order: 0,
    created_at: '2025-06-01T10:00:00.000Z',
    updated_at: '2025-06-01T10:00:00.000Z',
    follow_ups: [mockFollowUp],
  },
  {
    id: 'task-2',
    user_id: 'user-1',
    title: 'Fix bug B',
    description: '',
    status: 'in_progress',
    priority: 1,
    sort_order: 1,
    created_at: '2025-06-02T10:00:00.000Z',
    updated_at: '2025-06-02T10:00:00.000Z',
    follow_ups: [],
  },
  {
    id: 'task-3',
    user_id: 'user-1',
    title: 'Deploy v1',
    description: 'Ship it',
    status: 'done',
    priority: 0,
    sort_order: 2,
    created_at: '2025-06-03T10:00:00.000Z',
    updated_at: '2025-06-03T10:00:00.000Z',
    follow_ups: [],
  },
];

export const mockSession = {
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  expires_in: 3600,
  token_type: 'bearer' as const,
  user: {
    id: 'user-1',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
    created_at: '2025-01-01T00:00:00.000Z',
  },
};
