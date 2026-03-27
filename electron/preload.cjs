// Electron preload script
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onNewNote: (callback) => ipcRenderer.on('new-note', callback),
  onExportPDF: (callback) => ipcRenderer.on('export-pdf', callback),
  onPrint: (callback) => ipcRenderer.on('print', callback),
  onToggleSearch: (callback) => ipcRenderer.on('toggle-search', callback),
  onToggleGraph: (callback) => ipcRenderer.on('toggle-graph', callback),
  onToggleAI: (callback) => ipcRenderer.on('toggle-ai', callback),
  openExternal: (url) => ipcRenderer.send('shell-open', url),
});
