import {
  Bold, Italic, Underline, Strikethrough, Code, Link2,
  List, ListOrdered, CheckSquare, Quote,
  AlignLeft, AlignCenter, AlignRight,
  Table, Image, Minus, RotateCcw, RotateCw,
  Heading1, Heading2, Heading3,
  FileDown, Printer, FileText,
  Highlighter, Sigma,
} from 'lucide-react';
import './EditorToolbar.css';

interface EditorToolbarProps {
  editor: ReturnType<typeof import('@tiptap/react').useEditor> | null;
  onInsertMedia: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  onExportMd: () => void;
}

export default function EditorToolbar({
  editor,
  onInsertMedia,
  onExportPDF,
  onPrint,
  onExportMd,
}: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('Enter URL:', editor.getAttributes('link').href || '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertMath = () => {
    editor.chain().focus().insertContent('$$\\LaTeX$$').run();
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <RotateCw size={14} />
        </ToolBtn>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolBtn>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter size={14} />
        </ToolBtn>
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Insert Link">
          <Link2 size={14} />
        </ToolBtn>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={14} />
        </ToolBtn>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
          title="Task List"
        >
          <CheckSquare size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={14} />
        </ToolBtn>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ToolBtn onClick={insertMath} title="Insert Math (LaTeX)">
          <Sigma size={14} />
        </ToolBtn>
        <ToolBtn onClick={insertTable} title="Insert Table">
          <Table size={14} />
        </ToolBtn>
        <ToolBtn onClick={onInsertMedia} title="Insert Image / Video">
          <Image size={14} />
        </ToolBtn>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <ToolBtn onClick={onExportMd} title="Export as Markdown">
          <FileText size={14} />
        </ToolBtn>
        <ToolBtn onClick={onExportPDF} title="Export as PDF">
          <FileDown size={14} />
        </ToolBtn>
        <ToolBtn onClick={onPrint} title="Print">
          <Printer size={14} />
        </ToolBtn>
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      className={`toolbar-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}
