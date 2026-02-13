import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FollowUpBadge from './FollowUpBadge';
import { mockFollowUp, mockFollowUpNotified } from '@/__tests__/mocks/fixtures';

describe('FollowUpBadge', () => {
  it('renders the title and formatted date', () => {
    render(<FollowUpBadge followUp={mockFollowUp} />);
    expect(screen.getByText(/Check status/)).toBeInTheDocument();
    // date-fns format: "MMM d, h:mm a"
    expect(screen.getByText(/Jun 15/)).toBeInTheDocument();
  });

  it('applies notified styling for notified follow-ups', () => {
    const { container } = render(<FollowUpBadge followUp={mockFollowUpNotified} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('zinc-500');
  });

  it('applies pending styling for future non-notified follow-ups', () => {
    const futureFollowUp = {
      ...mockFollowUp,
      due_date: '2099-12-31T23:59:00.000Z',
    };
    const { container } = render(<FollowUpBadge followUp={futureFollowUp} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('purple');
  });

  it('applies overdue styling for past non-notified follow-ups', () => {
    const overdueFollowUp = {
      ...mockFollowUp,
      due_date: '2020-01-01T00:00:00.000Z',
      notified: false,
    };
    const { container } = render(<FollowUpBadge followUp={overdueFollowUp} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('red');
    expect(badge.className).toContain('animate-pulse');
  });
});
