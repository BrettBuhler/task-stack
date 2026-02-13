import { vi } from 'vitest';

type ChainResult = {
  data: unknown;
  error: null | { message: string };
};

/**
 * Chainable Supabase query mock factory.
 * Usage:
 *   const mock = createSupabaseMock();
 *   mock._results.from['tasks'].select = { data: [...], error: null };
 */
export function createChainableQuery(result: ChainResult = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};

  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'in', 'is', 'not', 'or', 'filter',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'textSearch', 'match', 'contains', 'containedBy',
    'overlaps', 'csv',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods resolve to result
  chain['then'] = vi.fn().mockImplementation((resolve: (v: ChainResult) => void) => {
    resolve(result);
    return Promise.resolve(result);
  });

  // Make it thenable
  Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });

  return chain;
}

export function createSupabaseMock(defaultResult: ChainResult = { data: null, error: null }) {
  const fromMock = vi.fn().mockImplementation(() => createChainableQuery(defaultResult));

  return {
    from: fromMock,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  };
}
