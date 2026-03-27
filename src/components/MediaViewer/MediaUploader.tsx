import { useState, useRef } from 'react';
import { Upload, Link2, X, Image, Film } from 'lucide-react';
import './MediaUploader.css';

interface MediaUploaderProps {
  onInsert: (url: string, type: 'image' | 'video') => void;
  onClose: () => void;
}

export default function MediaUploader({ onInsert, onClose }: MediaUploaderProps) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'video'>('image');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const type = file.type.startsWith('image/') ? 'image' : 'video';
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      onInsert(url, type);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleURLInsert = () => {
    if (!urlInput.trim()) return;
    onInsert(urlInput.trim(), urlType);
  };

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal-header">
          <span>Insert Media</span>
          <button className="media-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="media-tabs">
          <button
            className={`media-tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            <Upload size={14} /> Upload File
          </button>
          <button
            className={`media-tab ${tab === 'url' ? 'active' : ''}`}
            onClick={() => setTab('url')}
          >
            <Link2 size={14} /> From URL
          </button>
        </div>

        {tab === 'upload' && (
          <div
            className={`media-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="drop-zone-icons">
              <Image size={32} />
              <Film size={32} />
            </div>
            <p>Drag & drop or click to upload</p>
            <p className="drop-zone-hint">Images (PNG, JPG, GIF, WebP) · Videos (MP4, WebM)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {tab === 'url' && (
          <div className="media-url-form">
            <div className="url-type-selector">
              <button
                className={`url-type-btn ${urlType === 'image' ? 'active' : ''}`}
                onClick={() => setUrlType('image')}
              >
                <Image size={14} /> Image
              </button>
              <button
                className={`url-type-btn ${urlType === 'video' ? 'active' : ''}`}
                onClick={() => setUrlType('video')}
              >
                <Film size={14} /> Video
              </button>
            </div>
            <input
              className="url-input"
              type="url"
              placeholder="https://example.com/media.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleURLInsert()}
            />
            <button className="url-insert-btn" onClick={handleURLInsert}>
              Insert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
