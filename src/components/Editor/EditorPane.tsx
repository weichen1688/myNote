import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Mathematics from '@tiptap/extension-mathematics';
import Youtube from '@tiptap/extension-youtube';
import { all, createLowlight } from 'lowlight';
import type { Memo } from '../../types';
import EditorToolbar from './EditorToolbar';
import MediaUploader from '../MediaViewer/MediaUploader';
import { exportService } from '../../services/export';
import 'katex/dist/katex.min.css';
import './EditorPane.css';

const lowlight = createLowlight(all);

interface EditorPaneProps {
  memo: Memo | null;
  onUpdate: (updates: Partial<Memo>) => void;
}

export default function EditorPane({ memo, onUpdate }: EditorPaneProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedId = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder: 'Start writing… Use $…$ for inline math, $$…$$ for block math.' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Mathematics,
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose-editor',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      if (!memo) return;
      const html = editor.getHTML();
      const text = editor.getText();

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onUpdate({ content: html, rawContent: text });
      }, 500);
    },
  });

  // Sync memo content into editor when memo changes
  useEffect(() => {
    if (!memo) return;
    if (lastSavedId.current === memo.id) return;
    lastSavedId.current = memo.id;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(memo.title);
    setTags(memo.tags);

    if (editor && memo.content !== editor.getHTML()) {
      editor.commands.setContent(memo.content || '', false);
    }
  }, [memo, editor]);

  // Clean up pending save timer on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onUpdate({ title: newTitle });
      }, 500);
    },
    [onUpdate],
  );

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        onUpdate({ tags: newTags });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    onUpdate({ tags: newTags });
  };

  const handleInsertMedia = (url: string, type: 'image' | 'video') => {
    if (!editor) return;
    if (type === 'image') {
      editor.chain().focus().setImage({ src: url }).run();
    } else {
      // Validate URL to prevent HTML injection (only allow http/https/data protocols)
      let safeUrl: string;
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:', 'data:'].includes(parsed.protocol)) {
          console.warn('Blocked non-http(s) video URL');
          return;
        }
        safeUrl = parsed.href;
      } catch {
        console.warn('Invalid video URL');
        return;
      }
      // Insert video only after URL is validated and sanitized
      editor.chain().focus().insertContent(
        `<p><video controls style="max-width:100%;border-radius:8px"><source src="${safeUrl}"></video></p>`
      ).run();
    }
    setShowMediaUploader(false);
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !memo) return;
    await exportService.exportToPDF(contentRef.current, memo);
  };

  const handlePrint = () => {
    if (!contentRef.current || !memo) return;
    exportService.printMemo(contentRef.current, memo);
  };

  const handleExportMd = () => {
    if (!memo) return;
    exportService.exportToMarkdown(memo);
  };

  if (!memo) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <span className="editor-empty-icon">✦</span>
          <h2>Welcome to myNote</h2>
          <p>Select a note from the sidebar or create a new one to get started.</p>
          <ul className="feature-list">
            <li>📝 Rich text editing with Markdown</li>
            <li>🔢 LaTeX math equations ($E=mc^2$)</li>
            <li>🖼️ Images, videos, and media</li>
            <li>🤖 AI Copilot assistant</li>
            <li>🕸️ Knowledge graph visualization</li>
            <li>📄 PDF export and print</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-pane">
      <EditorToolbar
        editor={editor}
        onInsertMedia={() => setShowMediaUploader(true)}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
        onExportMd={handleExportMd}
      />

      <div className="editor-scroll" ref={contentRef}>
        <div className="editor-meta">
          <input
            className="editor-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
          />
          <div className="editor-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
                <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
              </span>
            ))}
            <input
              className="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ add tag"
            />
          </div>
        </div>

        <EditorContent editor={editor} className="editor-content" />
      </div>

      {showMediaUploader && (
        <MediaUploader
          onInsert={handleInsertMedia}
          onClose={() => setShowMediaUploader(false)}
        />
      )}
    </div>
  );
}
