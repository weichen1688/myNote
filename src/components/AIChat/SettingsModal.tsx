import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { storageService } from '../../services/storage';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

const MODEL_OPTIONS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const config = storageService.getConfig();
  const [apiKey, setApiKey] = useState(config['openai_api_key'] || '');
  const [model, setModel] = useState(config['openai_model'] || 'gpt-4o');
  const [baseURL, setBaseURL] = useState(config['openai_base_url'] || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    storageService.setConfig('openai_api_key', apiKey);
    storageService.setConfig('openai_model', model);
    storageService.setConfig('openai_base_url', baseURL);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>AI Settings</span>
          <button className="settings-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-field">
            <label>OpenAI API Key</label>
            <div className="key-input-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="settings-input"
              />
              <button className="toggle-key-btn" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="settings-hint">
              Your API key is stored locally and never sent anywhere except OpenAI.
            </p>
          </div>

          <div className="settings-field">
            <label>Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="settings-select"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label>Custom Base URL (optional)</label>
            <input
              type="url"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="settings-input"
            />
            <p className="settings-hint">
              Use a custom endpoint for OpenAI-compatible APIs (e.g., Azure, Ollama, local models).
            </p>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-cancel" onClick={onClose}>Cancel</button>
          <button className="settings-save" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
