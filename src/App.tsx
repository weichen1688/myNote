import { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import EditorPane from './components/Editor/EditorPane';
import AIChat from './components/AIChat/AIChat';
import KnowledgeGraph from './components/KnowledgeGraph/KnowledgeGraph';
import SearchPanel from './components/Search/SearchPanel';
import type { Memo, AppState } from './types';
import { storageService } from './services/storage';
import { Menu, GitGraph, MessageSquare, Search } from 'lucide-react';
import './App.css';

function App() {
  const [state, setState] = useState<AppState>({
    memos: [],
    selectedMemoId: null,
    sidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768,
    aiPanelOpen: false,
    graphPanelOpen: false,
    view: 'editor',
  });

  // Derive selectedMemo from selectedMemoId to eliminate dual source of truth
  const selectedMemo = useMemo(
    () => state.memos.find((m) => m.id === state.selectedMemoId) ?? null,
    [state.memos, state.selectedMemoId],
  );

  // Load memos on mount
  useEffect(() => {
    const memos = storageService.getAllMemos();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({
      ...s,
      memos,
      selectedMemoId: memos.length > 0 ? memos[0].id : null,
    }));
  }, []);

  const handleSelectMemo = useCallback((memo: Memo) => {
    setState((s) => ({ ...s, selectedMemoId: memo.id, view: 'editor' }));
  }, []);

  const handleCreateMemo = useCallback(() => {
    const newMemo = storageService.saveMemo({
      title: 'Untitled',
      content: '',
      rawContent: '',
    });
    setState((s) => ({
      ...s,
      memos: storageService.getAllMemos(),
      selectedMemoId: newMemo.id,
      view: 'editor',
    }));
  }, []);

  const handleUpdateMemo = useCallback((updates: Partial<Memo>) => {
    if (!selectedMemo) return;
    storageService.updateMemo(selectedMemo.id, updates);
    setState((s) => ({
      ...s,
      memos: storageService.getAllMemos(),
    }));
  }, [selectedMemo]);

  const handleDeleteMemo = useCallback((id: string) => {
    storageService.deleteMemo(id);
    const memos = storageService.getAllMemos();
    setState((s) => ({
      ...s,
      memos,
      selectedMemoId: memos.length > 0 ? memos[0].id : null,
    }));
  }, []);

  const toggleSidebar = () =>
    setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen }));

  const toggleAI = () =>
    setState((s) => ({ ...s, aiPanelOpen: !s.aiPanelOpen, graphPanelOpen: false }));

  const toggleGraph = () =>
    setState((s) => ({ ...s, graphPanelOpen: !s.graphPanelOpen, aiPanelOpen: false, view: s.graphPanelOpen ? 'editor' : 'graph' }));

  const toggleSearch = () =>
    setState((s) => ({ ...s, view: s.view === 'search' ? 'editor' : 'search', graphPanelOpen: false }));

  const closePanels = () =>
    setState((s) => ({ ...s, sidebarOpen: false, aiPanelOpen: false }));

  return (
    <div className="app-layout">
      {/* Mobile overlay backdrop */}
      {(state.sidebarOpen || state.aiPanelOpen) && (
        <div className="panel-backdrop" onClick={closePanels} aria-hidden="true" />
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button className="icon-btn" onClick={toggleSidebar} title="Toggle Sidebar">
            <Menu size={18} />
          </button>
          <div className="app-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">myNote</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className={`icon-btn ${state.view === 'search' ? 'active' : ''}`}
            onClick={toggleSearch}
            title="Search (Ctrl+F)"
          >
            <Search size={18} />
          </button>
          <button
            className={`icon-btn ${state.graphPanelOpen ? 'active' : ''}`}
            onClick={toggleGraph}
            title="Knowledge Graph"
          >
            <GitGraph size={18} />
          </button>
          <button
            className={`icon-btn ${state.aiPanelOpen ? 'active' : ''}`}
            onClick={toggleAI}
            title="AI Copilot"
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="app-body">
        {/* Sidebar */}
        {state.sidebarOpen && (
          <Sidebar
            memos={state.memos}
            selectedMemoId={state.selectedMemoId}
            onSelectMemo={handleSelectMemo}
            onCreateMemo={handleCreateMemo}
            onDeleteMemo={handleDeleteMemo}
          />
        )}

        {/* Main content area */}
        <main className="main-content">
          {state.view === 'search' && (
            <SearchPanel
              memos={state.memos}
              onSelectMemo={(memo) => {
                handleSelectMemo(memo);
                setState((s) => ({ ...s, view: 'editor' }));
              }}
            />
          )}
          {state.view === 'graph' && (
            <KnowledgeGraph
              memos={state.memos}
              selectedMemoId={state.selectedMemoId}
              onSelectMemo={(memo) => {
                handleSelectMemo(memo);
                setState((s) => ({ ...s, view: 'editor', graphPanelOpen: false }));
              }}
            />
          )}
          {state.view === 'editor' && (
            <EditorPane
              memo={selectedMemo}
              onUpdate={handleUpdateMemo}
            />
          )}
        </main>

        {/* AI Chat Panel */}
        {state.aiPanelOpen && (
          <AIChat
            currentMemo={selectedMemo}
            memos={state.memos}
          />
        )}
      </div>
    </div>
  );
}

export default App;
