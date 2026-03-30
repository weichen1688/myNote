export interface Memo {
  id: string;
  title: string;
  content: string; // HTML content from TipTap
  rawContent: string; // plain text for search
  tags: string[];
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  links: string[]; // IDs of linked memos
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type
  url: string; // data URL or object URL
  size: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  group?: string;
  size?: number;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  strength?: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export interface AppState {
  memos: Memo[];
  selectedMemoId: string | null;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  graphPanelOpen: boolean;
  view: 'editor' | 'graph' | 'search';
}

export interface AIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}
