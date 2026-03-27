import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, Memo } from '../../types';
import { aiService } from '../../services/ai';
import { storageService } from '../../services/storage';
import SettingsModal from './SettingsModal';
import './AIChat.css';

interface AIChatProps {
  currentMemo: Memo | null;
  memos: Memo[];
}

export default function AIChat({ currentMemo, memos }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, streamingText]);

  const config = storageService.getConfig();
  const hasAPIKey = !!config['openai_api_key'];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    setStreamingText('');

    try {
      const allMessages = [...messages, userMessage];
      let fullResponse = '';

      await aiService.chat(allMessages, currentMemo, (chunk) => {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      });

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await aiService.summarizeAllMemos();
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `📚 **Knowledge Base Summary**\n\n${summary}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to summarize';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeCurrent = () => {
    if (!currentMemo) return;
    setInput(`Please summarize and analyze the key points of the note: "${currentMemo.title}"`);
  };

  return (
    <aside className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-header-left">
          <Bot size={16} className="ai-icon" />
          <span>AI Copilot</span>
        </div>
        <button
          className="ai-settings-btn"
          onClick={() => setShowSettings(true)}
          title="AI Settings"
        >
          <Settings size={14} />
        </button>
      </div>

      {!hasAPIKey && (
        <div className="ai-no-key">
          <Sparkles size={24} />
          <p>Add your OpenAI API key to enable AI features.</p>
          <button className="ai-setup-btn" onClick={() => setShowSettings(true)}>
            Configure API Key
          </button>
        </div>
      )}

      <div className="ai-quick-actions">
        <button
          className="quick-action-btn"
          onClick={handleSummarizeCurrent}
          disabled={!currentMemo || !hasAPIKey}
          title="Summarize current note"
        >
          <BookOpen size={12} /> Summarize Note
        </button>
        <button
          className="quick-action-btn"
          onClick={handleSummarizeAll}
          disabled={memos.length === 0 || !hasAPIKey}
          title="Summarize all notes"
        >
          <Sparkles size={12} /> Summary of All Notes
        </button>
      </div>

      <div className="ai-messages">
        {messages.length === 0 && hasAPIKey && (
          <div className="ai-welcome">
            <Bot size={28} className="ai-welcome-icon" />
            <p>Hello! I&apos;m your AI writing assistant.</p>
            <p className="ai-welcome-hint">
              Ask me to summarize your notes, explain concepts, generate content,
              or find connections between ideas.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {streamingText && (
          <div className="message message-assistant streaming">
            <div className="message-avatar assistant-avatar">
              <Bot size={14} />
            </div>
            <div className="message-content">
              <MessageText text={streamingText} />
              <span className="streaming-cursor">▌</span>
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="message message-assistant">
            <div className="message-avatar assistant-avatar">
              <Bot size={14} />
            </div>
            <div className="message-content">
              <Loader2 size={16} className="spin" />
            </div>
          </div>
        )}

        {error && (
          <div className="ai-error">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-area">
        <textarea
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={hasAPIKey ? 'Ask anything… (Enter to send, Shift+Enter for newline)' : 'Configure API key to chat'}
          disabled={!hasAPIKey || loading}
          rows={2}
        />
        <button
          className="ai-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || !hasAPIKey || loading}
        >
          <Send size={14} />
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </aside>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className="message-content">
        <MessageText text={message.content} />
      </div>
    </div>
  );
}

function MessageText({ text }: { text: string }) {
  // Simple markdown-like rendering
  const rendered = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  return <div className="message-text" dangerouslySetInnerHTML={{ __html: rendered }} />;
}
