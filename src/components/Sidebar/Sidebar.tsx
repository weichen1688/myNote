import { useState } from 'react';
import { Plus, Trash2, FileText, Tag } from 'lucide-react';
import type { Memo } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  memos: Memo[];
  selectedMemoId: string | null;
  onSelectMemo: (memo: Memo) => void;
  onCreateMemo: () => void;
  onDeleteMemo: (id: string) => void;
}

export default function Sidebar({
  memos,
  selectedMemoId,
  onSelectMemo,
  onCreateMemo,
  onDeleteMemo,
}: SidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDeleteMemo(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Notes</span>
        <button className="sidebar-new-btn" onClick={onCreateMemo} title="New note">
          <Plus size={16} />
        </button>
      </div>

      <div className="memo-list">
        {memos.length === 0 && (
          <div className="memo-empty">
            <FileText size={32} className="empty-icon" />
            <p>No notes yet</p>
            <button className="create-first-btn" onClick={onCreateMemo}>
              Create your first note
            </button>
          </div>
        )}
        {memos.map((memo) => (
          <div
            key={memo.id}
            className={`memo-item ${selectedMemoId === memo.id ? 'selected' : ''}`}
            onClick={() => onSelectMemo(memo)}
          >
            <div className="memo-item-header">
              <span className="memo-item-title">{memo.title || 'Untitled'}</span>
              <button
                className={`memo-delete-btn ${confirmDelete === memo.id ? 'confirm' : ''}`}
                onClick={(e) => handleDelete(e, memo.id)}
                title={confirmDelete === memo.id ? 'Click again to confirm' : 'Delete note'}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="memo-item-preview">
              {memo.rawContent.slice(0, 60) || 'No content'}
            </div>
            <div className="memo-item-footer">
              <span className="memo-date">{formatDate(memo.updatedAt)}</span>
              {memo.tags.length > 0 && (
                <div className="memo-tags">
                  <Tag size={10} />
                  <span>{memo.tags.slice(0, 2).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
