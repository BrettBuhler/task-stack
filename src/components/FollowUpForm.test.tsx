import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FollowUpForm from './FollowUpForm';

// Mock DateTimePicker to simplify testing
vi.mock('./DateTimePicker', () => ({
  default: ({
    value,
    onChange,
    ariaLabelledBy,
  }: {
    value: string;
    onChange: (v: string) => void;
    ariaLabelledBy?: string;
  }) => (
    <input
      data-testid="date-picker"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Pick date & time..."
      aria-labelledby={ariaLabelledBy}
    />
  ),
}));

describe('FollowUpForm', () => {
  it('renders as a modal overlay', () => {
    const { container } = render(
      <FollowUpForm taskId="task-1" onSubmit={vi.fn()} onCancel={vi.fn()} />
    );
    // Should have fixed positioning overlay
    expect(container.firstChild).toHaveClass('fixed');
  });

  it('shows title and due date fields', () => {
    render(<FollowUpForm taskId="task-1" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText('Follow-up title...')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
  });

  it('disables submit when title or due date is missing', () => {
    render(<FollowUpForm taskId="task-1" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add Follow-Up' })).toBeDisabled();
  });

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<FollowUpForm taskId="task-1" onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Follow-up title...'), 'Check back');
    await user.type(screen.getByTestId('date-picker'), '2025-12-01T09:00:00.000Z');
    await user.click(screen.getByRole('button', { name: 'Add Follow-Up' }));

    expect(onSubmit).toHaveBeenCalledWith({
      task_id: 'task-1',
      title: 'Check back',
      due_date: '2025-12-01T09:00:00.000Z',
    });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<FollowUpForm taskId="task-1" onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
