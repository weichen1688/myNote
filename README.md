# ✦ myNote – AI-Powered Knowledge Base


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Run (Web App)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run (macOS Desktop App)
```bash
npm run electron:dev
```

### Build for Production

**Web:**
```bash
npm run build
```

**macOS App:**
```bash
npm run electron:build
```

## 🤖 AI Configuration

1. Click the **AI Copilot** button (💬) in the top right
2. Click the ⚙️ settings icon
3. Enter your OpenAI API key
4. Choose your preferred model (gpt-4o recommended)
5. Optionally set a custom base URL for OpenAI-compatible APIs

> API keys are stored locally and never sent anywhere except OpenAI's servers.

## ✍️ Writing Tips

- **Markdown shortcuts**: Type `#` for headings, `**bold**`, `*italic*`, `` `code` ``
- **Math equations**: Use `$E=mc^2$` for inline math, `$$\int_0^\infty$$` for block math
- **Code blocks**: Type ` ``` ` followed by a language name
- **Task lists**: Type `- [ ]` for a checkbox item
- **Tables**: Use the toolbar or type `/table`

## 🏗️ Architecture

```
myNote/
├── src/
│   ├── components/
│   │   ├── Editor/          # TipTap rich text editor + toolbar
│   │   ├── Sidebar/         # Note list and navigation
│   │   ├── KnowledgeGraph/  # D3.js graph visualization
│   │   ├── AIChat/          # OpenAI-powered chat panel
│   │   ├── MediaViewer/     # Media upload/embed
│   │   └── Search/          # Full-text search
│   ├── services/
│   │   ├── storage.ts       # localStorage persistence
│   │   ├── ai.ts            # OpenAI API integration
│   │   └── export.ts        # PDF/print/markdown export
│   ├── types/               # TypeScript interfaces
│   └── App.tsx              # Main application
├── electron/
│   ├── main.cjs             # Electron main process
│   └── preload.cjs          # Context bridge
└── package.json
```

## 🔮 Planned Features

- [ ] Cloud sync (e.g. iCloud, Dropbox)
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] Mobile app (React Native)
- [ ] More AI providers (Anthropic Claude, local models via Ollama)
- [ ] Backlinks panel
- [ ] Daily notes / journal mode
- [ ] Calendar view
