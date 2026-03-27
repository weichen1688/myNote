import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Sidebar from '../components/Sidebar/Sidebar';
import type { Memo } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMemo(overrides: Partial<Memo> & { id: string }): Memo {
  return {
    title: 'Untitled',
    content: '',
    rawContent: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    links: [],
    ...overrides,
  };
}

const today = new Date().toISOString();
const yesterday = new Date(Date.now() - 86_400_000).toISOString();
const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();

const sampleMemos: Memo[] = [
  makeMemo({ id: '1', title: 'First Note', rawContent: 'Some content here', tags: ['react'], updatedAt: today }),
  makeMemo({ id: '2', title: 'Second Note', rawContent: 'Other content here', tags: ['typescript', 'vitest'], updatedAt: yesterday }),
  makeMemo({ id: '3', title: 'Third Note', rawContent: '', updatedAt: threeDaysAgo }),
];

const defaultProps = {
  memos: sampleMemos,
  selectedMemoId: null,
  onSelectMemo: vi.fn(),
  onCreateMemo: vi.fn(),
  onDeleteMemo: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Sidebar – rendering', () => {
  it('renders the "Notes" section heading', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders all memo titles', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('First Note')).toBeInTheDocument();
    expect(screen.getByText('Second Note')).toBeInTheDocument();
    expect(screen.getByText('Third Note')).toBeInTheDocument();
  });

  it('renders "No content" placeholder for memos with empty rawContent', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('shows rawContent preview (truncated to 60 chars)', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Some content here')).toBeInTheDocument();
  });

  it('renders tags for memos that have them (up to 2)', () => {
    render(<Sidebar {...defaultProps} />);
    // First memo: ['react'] → "react"
    expect(screen.getByText('react')).toBeInTheDocument();
    // Second memo: ['typescript','vitest'] → "typescript, vitest"
    expect(screen.getByText('typescript, vitest')).toBeInTheDocument();
  });

  it('shows "Today" date label for notes updated today', () => {
    render(<Sidebar {...defaultProps} />);
    // At least one "Today" should be present
    expect(screen.getAllByText('Today').length).toBeGreaterThan(0);
  });

  it('shows "Yesterday" date label for notes updated yesterday', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('shows "Xd ago" label for notes older than 1 day', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  it('renders empty-state UI when no memos exist', () => {
    render(<Sidebar {...defaultProps} memos={[]} />);
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first note')).toBeInTheDocument();
  });

  it('applies "selected" class to the selected memo', () => {
    const { container } = render(<Sidebar {...defaultProps} selectedMemoId="2" />);
    const items = container.querySelectorAll('.memo-item');
    const selected = Array.from(items).filter((el) => el.classList.contains('selected'));
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Second Note');
  });

  it('does not apply "selected" class when selectedMemoId is null', () => {
    const { container } = render(<Sidebar {...defaultProps} selectedMemoId={null} />);
    expect(container.querySelectorAll('.memo-item.selected')).toHaveLength(0);
  });
});

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('Sidebar – create note', () => {
  it('calls onCreateMemo when the + button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('New note'));
    expect(defaultProps.onCreateMemo).toHaveBeenCalledTimes(1);
  });

  it('calls onCreateMemo when "Create your first note" button is clicked', () => {
    render(<Sidebar {...defaultProps} memos={[]} />);
    fireEvent.click(screen.getByText('Create your first note'));
    expect(defaultProps.onCreateMemo).toHaveBeenCalledTimes(1);
  });
});

describe('Sidebar – select memo', () => {
  it('calls onSelectMemo with the correct memo when clicked', () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Second Note'));
    expect(defaultProps.onSelectMemo).toHaveBeenCalledWith(sampleMemos[1]);
  });
});

describe('Sidebar – delete memo (two-click confirmation)', () => {
  it('does NOT call onDeleteMemo on the first trash-button click', () => {
    render(<Sidebar {...defaultProps} />);
    // All delete buttons share the title "Delete note" initially
    const deleteBtns = screen.getAllByTitle('Delete note');
    fireEvent.click(deleteBtns[0]);
    expect(defaultProps.onDeleteMemo).not.toHaveBeenCalled();
  });

  it('shows "Click again to confirm" title after first click', () => {
    render(<Sidebar {...defaultProps} />);
    const [firstBtn] = screen.getAllByTitle('Delete note');
    fireEvent.click(firstBtn);
    expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument();
  });

  it('calls onDeleteMemo on the second click (confirmation)', () => {
    render(<Sidebar {...defaultProps} />);
    const [firstBtn] = screen.getAllByTitle('Delete note');
    fireEvent.click(firstBtn);
    const confirmBtn = screen.getByTitle('Click again to confirm');
    fireEvent.click(confirmBtn);
    expect(defaultProps.onDeleteMemo).toHaveBeenCalledWith(sampleMemos[0].id);
  });

  it('does not propagate click to onSelectMemo when delete is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    const [firstBtn] = screen.getAllByTitle('Delete note');
    fireEvent.click(firstBtn);
    expect(defaultProps.onSelectMemo).not.toHaveBeenCalled();
  });

  it('resets confirm state if not confirmed within timeout', async () => {
    vi.useFakeTimers();
    render(<Sidebar {...defaultProps} />);
    const [firstBtn] = screen.getAllByTitle('Delete note');
    fireEvent.click(firstBtn);

    // Advance past the 2-second auto-reset
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    // "Click again to confirm" should be gone
    expect(screen.queryByTitle('Click again to confirm')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
