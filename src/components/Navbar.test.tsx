import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';

// Override the default usePathname mock for specific tests
const mockUsePathname = vi.fn().mockReturnValue('/');

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual as object,
    usePathname: () => mockUsePathname(),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
  };
});

vi.mock('@/lib/notifications', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue(true),
  getNotificationPermissionState: vi.fn().mockReturnValue('default'),
}));

describe('Navbar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('Stack')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights the active link', () => {
    mockUsePathname.mockReturnValue('/markdown');
    render(<Navbar />);
    const markdownLink = screen.getByText('Markdown');
    expect(markdownLink.className).toContain('text-cyan-400');
  });

  it('shows notification button when permission is default', () => {
    render(<Navbar />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('handles notification button click', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByText('Notifications'));
    // The mock resolves to true, so toast.success should fire
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Notifications enabled');
  });
});
