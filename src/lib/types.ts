export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  follow_ups?: FollowUp[];
}

export interface FollowUp {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  due_date: string;
  notified: boolean;
  created_at: string;
}

export interface EmailPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  custom_cron: string | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = Task['status'];

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  sort_order?: number;
}

export interface CreateFollowUpInput {
  task_id: string;
  title: string;
  due_date: string;
}
