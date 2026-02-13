import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @supabase/ssr before importing auth
const mockGetSession = vi.fn();
const mockCreateBrowserClient = vi.fn().mockReturnValue({
  auth: { getSession: mockGetSession },
});
const mockCreateServerClient = vi.fn().mockReturnValue({
  auth: { getSession: vi.fn() },
});

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
  createServerClient: mockCreateServerClient,
}));

import { getSession, createMiddlewareClient } from './auth';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSession', () => {
    it('returns session on success', async () => {
      const session = { user: { id: '1' }, access_token: 'tok' };
      mockGetSession.mockResolvedValue({ data: { session }, error: null });
      const result = await getSession();
      expect(result).toEqual(session);
    });

    it('returns null on error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Something went wrong' },
      });
      const result = await getSession();
      expect(result).toBeNull();
    });
  });

  describe('createMiddlewareClient', () => {
    it('creates a server client with cookie handlers', () => {
      const request = {
        cookies: {
          getAll: vi.fn().mockReturnValue([]),
          set: vi.fn(),
        },
      };
      const response = {
        cookies: { set: vi.fn() },
      };

      createMiddlewareClient(request as never, response as never);
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });
  });
});
