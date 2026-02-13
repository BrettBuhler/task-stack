import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';

describe('TaskForm', () => {
  it('shows only the title input initially (collapsed)', () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument();
    expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
  });

  it('expands on focus to show description and buttons', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={vi.fn()} />);
    await user.click(screen.getByPlaceholderText('Add a new task...'));
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not submit when title is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm onSubmit={onSubmit} />);
    await user.click(screen.getByPlaceholderText('Add a new task...'));
    const addButton = screen.getByText('Add Task');
    expect(addButton).toBeDisabled();
    onSubmit.mockClear();
  });

  it('submits with title and description, then clears the form', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm onSubmit={onSubmit} />);

    const titleInput = screen.getByPlaceholderText('Add a new task...');
    await user.click(titleInput);
    await user.type(titleInput, 'My Task');
    await user.type(screen.getByPlaceholderText('Description (optional)'), 'Details');
    await user.click(screen.getByText('Add Task'));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'My Task',
      description: 'Details',
    });

    // Form should collapse and clear
    expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
  });

  it('collapses and clears when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('Add a new task...');
    await user.click(titleInput);
    await user.type(titleInput, 'Temp');
    await user.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a new task...')).toHaveValue('');
  });
});
