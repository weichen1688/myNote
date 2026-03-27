import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchPanel from '../components/Search/SearchPanel';
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

const sampleMemos: Memo[] = [
  makeMemo({ id: '1', title: 'TypeScript Handbook', rawContent: 'Generics and types', tags: ['typescript'] }),
  makeMemo({ id: '2', title: 'React Patterns', rawContent: 'Hooks, context, render props', tags: ['react', 'frontend'] }),
  makeMemo({ id: '3', title: 'Python Basics', rawContent: 'Variables and loops', tags: ['python'] }),
];

// ─── highlight utility (tested indirectly via rendered HTML) ──────────────────

describe('SearchPanel – highlight rendering', () => {
  it('wraps matching text in <mark> tags', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'TypeScript' } });

    // The title "TypeScript Handbook" should have a <mark> around "TypeScript"
    const marks = document.querySelectorAll('mark');
    const markTexts = Array.from(marks).map((m) => m.textContent);
    expect(markTexts.some((t) => /typescript/i.test(t ?? ''))).toBe(true);
  });

  it('is case-insensitive when highlighting', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'react' } });

    const marks = document.querySelectorAll('mark');
    const markTexts = Array.from(marks).map((m) => m.textContent?.toLowerCase());
    expect(markTexts).toContain('react');
  });

  it('does not inject extra marks when query is empty', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });

  it('handles regex-special characters in query without throwing', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    // Should not throw even with regex metacharacters
    expect(() =>
      fireEvent.change(input, { target: { value: '(test[0]' } }),
    ).not.toThrow();
  });
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('SearchPanel – initial render', () => {
  it('renders the "Search Notes" heading', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    expect(screen.getByText('Search Notes')).toBeInTheDocument();
  });

  it('shows total note count when no query is entered', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    expect(screen.getByText('3 total notes')).toBeInTheDocument();
  });

  it('renders all memo titles initially', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    expect(screen.getByText('TypeScript Handbook')).toBeInTheDocument();
    expect(screen.getByText('React Patterns')).toBeInTheDocument();
    expect(screen.getByText('Python Basics')).toBeInTheDocument();
  });

  it('renders tags for memos that have them', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    expect(screen.getByText('#typescript')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();
    expect(screen.getByText('#frontend')).toBeInTheDocument();
  });

  it('renders empty-state message when memos list is empty', () => {
    render(<SearchPanel memos={[]} onSelectMemo={vi.fn()} />);
    expect(screen.getByText('0 total notes')).toBeInTheDocument();
  });
});

// ─── Filtering ────────────────────────────────────────────────────────────────

describe('SearchPanel – filtering', () => {
  it('filters by title (case-insensitive)', () => {
    const { container } = render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'python' } });

    // Check result count (highlight splits text nodes, so use container query)
    expect(screen.getByText(/1 result for/)).toBeInTheDocument();
    const items = container.querySelectorAll('.search-result-item');
    expect(items).toHaveLength(1);
    // The one item shown should contain "Python Basics" text
    expect(items[0].textContent).toMatch(/Python\s+Basics/i);
  });

  it('filters by rawContent', () => {
    const { container } = render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'hooks' } });

    const items = container.querySelectorAll('.search-result-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toMatch(/React\s+Patterns/i);
  });

  it('filters by tag', () => {
    const { container } = render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'frontend' } });

    const items = container.querySelectorAll('.search-result-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toMatch(/React\s+Patterns/i);
  });

  it('shows "0 results" message when nothing matches', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'xyzzy-nomatch' } });

    expect(screen.getByText(/0 results for/)).toBeInTheDocument();
  });

  it('shows result count when query matches', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'typescript' } });

    expect(screen.getByText(/1 result for/)).toBeInTheDocument();
  });

  it('shows the clear (×) button only when query is non-empty', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    expect(screen.queryByText('×')).not.toBeInTheDocument();

    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('clears the query when the × button is clicked', () => {
    render(<SearchPanel memos={sampleMemos} onSelectMemo={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search across all notes…') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'python' } });
    fireEvent.click(screen.getByText('×'));

    expect(input.value).toBe('');
    // all memos should be visible again (no filtering → no <mark> wrapping)
    expect(screen.getByText('TypeScript Handbook')).toBeInTheDocument();
  });
});

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('SearchPanel – interactions', () => {
  it('calls onSelectMemo with the correct memo when a result is clicked', () => {
    const onSelect = vi.fn();
    render(<SearchPanel memos={sampleMemos} onSelectMemo={onSelect} />);

    // No query → no highlighting → plain text is findable
    fireEvent.click(screen.getByText('React Patterns'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleMemos[1]);
  });

  it('calls onSelectMemo correctly after filtering', () => {
    const onSelect = vi.fn();
    const { container } = render(<SearchPanel memos={sampleMemos} onSelectMemo={onSelect} />);

    const input = screen.getByPlaceholderText('Search across all notes…');
    fireEvent.change(input, { target: { value: 'python' } });

    // Click the result item div (the highlighting splits the title text node)
    const resultItem = container.querySelector('.search-result-item');
    expect(resultItem).not.toBeNull();
    fireEvent.click(resultItem!);

    expect(onSelect).toHaveBeenCalledWith(sampleMemos[2]);
  });
});
