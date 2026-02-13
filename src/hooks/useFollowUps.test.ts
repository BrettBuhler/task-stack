import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFollowUps } from './useFollowUps';

function chainable(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'lte', 'order', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
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

vi.mock('@/lib/notifications', () => ({
  sendBrowserNotification: vi.fn(),
}));

describe('useFollowUps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockFrom.mockReturnValue(chainable({ data: null, error: null }));
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks due follow-ups on mount', async () => {
    mockFrom.mockReturnValue(chainable({ data: [], error: null }));
    renderHook(() => useFollowUps());
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFrom).toHaveBeenCalledWith('follow_ups');
  });

  it('polls every 30 seconds', async () => {
    mockFrom.mockReturnValue(chainable({ data: [], error: null }));
    renderHook(() => useFollowUps());
    await vi.advanceTimersByTimeAsync(0);
    const initialCount = mockFrom.mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mockFrom.mock.calls.length).toBeGreaterThan(initialCount);
  });

  it('calls onFollowUpNotified when due follow-ups are found', async () => {
    const dueFollowUp = {
      id: 'fu-1',
      title: 'Check it',
      due_date: new Date(Date.now() - 60_000).toISOString(),
      notified: false,
      tasks: { title: 'Task A' },
    };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // First call is the check query, second is the update
      if (callCount === 1) return chainable({ data: [dueFollowUp], error: null });
      return chainable({ data: null, error: null });
    });

    const onNotified = vi.fn();
    renderHook(() => useFollowUps(onNotified));
    await vi.advanceTimersByTimeAsync(0);
    await waitFor(() => expect(onNotified).toHaveBeenCalled());
  });

  it('createFollowUp returns the created follow-up', async () => {
    const created = { id: 'fu-new', title: 'New FU', task_id: 'task-1', user_id: 'user-1', due_date: '2025-12-01T00:00:00Z', notified: false, created_at: '' };
    // First call: mount check, second+: create
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: [], error: null });
      return chainable({ data: created, error: null });
    });

    const { result } = renderHook(() => useFollowUps());
    await vi.advanceTimersByTimeAsync(0);

    let res: unknown;
    await act(async () => {
      res = await result.current.createFollowUp({ task_id: 'task-1', title: 'New FU', due_date: '2025-12-01T00:00:00Z' });
    });
    expect(res).toEqual(created);
  });

  it('deleteFollowUp returns true on success', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: [], error: null });
      return chainable({ data: null, error: null });
    });

    const { result } = renderHook(() => useFollowUps());
    await vi.advanceTimersByTimeAsync(0);

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.deleteFollowUp('fu-1');
    });
    expect(ok).toBe(true);
  });

  it('cleans up interval on unmount', async () => {
    mockFrom.mockReturnValue(chainable({ data: [], error: null }));
    const { unmount } = renderHook(() => useFollowUps());
    await vi.advanceTimersByTimeAsync(0);
    unmount();
    const countAfterUnmount = mockFrom.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    // No new calls after unmount
    expect(mockFrom.mock.calls.length).toBe(countAfterUnmount);
  });
});
