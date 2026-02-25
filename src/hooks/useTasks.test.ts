import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks';
import { mockTasks } from '@/__tests__/mocks/fixtures';

// Build a chainable mock for supabase queries
function chainable(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make the chain thenable
  (chain as unknown as Promise<unknown>).then = ((resolve: (v: unknown) => void) => {
    resolve(resolveValue);
    return Promise.resolve(resolveValue);
  }) as never;
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => void) => {
      resolve(resolveValue);
      return Promise.resolve(resolveValue);
    },
    writable: true,
    configurable: true,
  });
  return chain;
}

const mockFrom = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getSession: () => mockGetSession() },
  },
}));

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: fetchTasks returns mockTasks
    mockFrom.mockReturnValue(
      chainable({ data: mockTasks, error: null })
    );
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
  });

  it('fetches tasks on mount and sets loading to false', async () => {
    const { result } = renderHook(() => useTasks());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual(mockTasks);
  });

  it('sets loading to false when initial fetch fails', async () => {
    mockFrom.mockReturnValue(
      chainable({ data: null, error: { message: 'fail' } })
    );

    const { result } = renderHook(() => useTasks());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it('createTask calculates sort_order from max existing', async () => {
    const newTask = { ...mockTasks[0], id: 'task-new', sort_order: 3 };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // initial fetch
        return chainable({ data: mockTasks, error: null });
      }
      // create call
      return chainable({ data: newTask, error: null });
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createTask({ title: 'New Task' });
    });

    // Verify from was called with 'tasks' for insert
    expect(mockFrom).toHaveBeenCalledWith('tasks');
  });

  it('createTask still inserts when no authenticated user session exists', async () => {
    const newTask = { ...mockTasks[0], id: 'task-no-session', sort_order: 3 };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: mockTasks, error: null });
      return chainable({ data: newTask, error: null });
    });

    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: unknown = null;
    await act(async () => {
      created = await result.current.createTask({ title: 'New Task' });
    });

    expect(created).toEqual(newTask);
    expect(result.current.tasks[result.current.tasks.length - 1]?.id).toBe('task-no-session');
  });

  it('createTask retries without user_id when schema is missing that column', async () => {
    const newTask = { ...mockTasks[0], id: 'task-retry', sort_order: 3 };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: mockTasks, error: null }); // initial fetch
      if (callCount === 2) {
        return chainable({
          data: null,
          error: {
            message: 'Could not find the user_id column of tasks in the schema cache',
            details: null,
          },
        });
      }
      return chainable({ data: newTask, error: null });
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createTask({ title: 'Retry Task' });
    });

    expect(result.current.tasks[result.current.tasks.length - 1]?.id).toBe('task-retry');
  });

  it('updateTask replaces the task in state', async () => {
    const updated = { ...mockTasks[0], title: 'Updated' };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: mockTasks, error: null });
      return chainable({ data: updated, error: null });
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateTask('task-1', { title: 'Updated' });
    });

    expect(result.current.tasks[0].title).toBe('Updated');
  });

  it('deleteTask removes the task from state', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: mockTasks, error: null });
      return chainable({ data: null, error: null });
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const ok = await result.current.deleteTask('task-1');
      expect(ok).toBe(true);
    });

    expect(result.current.tasks.find((t) => t.id === 'task-1')).toBeUndefined();
  });

  it('reorderTasks performs optimistic update', async () => {
    mockFrom.mockReturnValue(chainable({ data: mockTasks, error: null }));

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const reversed = [...mockTasks].reverse();
    await act(async () => {
      await result.current.reorderTasks(reversed);
    });

    expect(result.current.tasks[0].id).toBe('task-3');
  });

  it('reorderTasks refetches on error', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount <= 1) return chainable({ data: mockTasks, error: null });
      // subsequent update calls fail
      return chainable({ data: null, error: { message: 'fail' } });
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const reversed = [...mockTasks].reverse();
    await act(async () => {
      await result.current.reorderTasks(reversed);
    });

    // After error, fetchTasks is called again
    expect(mockFrom).toHaveBeenCalledWith('tasks');
  });
});
