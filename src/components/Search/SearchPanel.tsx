import { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import type { Memo } from '../../types';
import './SearchPanel.css';

interface SearchPanelProps {
  memos: Memo[];
  onSelectMemo: (memo: Memo) => void;
}

function highlight(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

export default function SearchPanel({ memos, onSelectMemo }: SearchPanelProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return memos;
    const q = query.toLowerCase();
    return memos.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.rawContent.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [memos, query]);

  const getPreview = (memo: Memo): string => {
    if (!query.trim()) return memo.rawContent.slice(0, 100) || 'No content';
    const q = query.toLowerCase();
    const idx = memo.rawContent.toLowerCase().indexOf(q);
    if (idx === -1) return memo.rawContent.slice(0, 100) || 'No content';
    const start = Math.max(0, idx - 30);
    const end = Math.min(memo.rawContent.length, idx + 100);
    return (start > 0 ? '…' : '') + memo.rawContent.slice(start, end) + (end < memo.rawContent.length ? '…' : '');
  };

  return (
    <div className="search-panel">
      <div className="search-header">
        <Search size={16} className="search-icon" />
        <span>Search Notes</span>
      </div>

      <div className="search-input-wrap">
        <Search size={14} className="search-input-icon" />
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all notes…"
          autoFocus
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')}>×</button>
        )}
      </div>

      <div className="search-results-count">
        {query
          ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
          : `${memos.length} total note${memos.length !== 1 ? 's' : ''}`}
      </div>

      <div className="search-results">
        {results.length === 0 && (
          <div className="search-empty">
            <p>No notes found for &quot;{query}&quot;</p>
          </div>
        )}

        {results.map((memo) => (
          <div
            key={memo.id}
            className="search-result-item"
            onClick={() => onSelectMemo(memo)}
          >
            <div className="search-result-header">
              <FileText size={13} className="result-icon" />
              <span
                className="search-result-title"
                dangerouslySetInnerHTML={{ __html: highlight(memo.title || 'Untitled', query) }}
              />
            </div>
            <p
              className="search-result-preview"
              dangerouslySetInnerHTML={{ __html: highlight(getPreview(memo), query) }}
            />
            {memo.tags.length > 0 && (
              <div className="search-result-tags">
                {memo.tags.map((t) => (
                  <span key={t} className="search-tag">#{t}</span>
                ))}
              </div>
            )}
            <span className="search-result-date">
              {new Date(memo.updatedAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
