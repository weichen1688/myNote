import { v4 as uuidv4 } from 'uuid';
import type { Memo, Attachment } from '../types';

const STORAGE_KEY = 'myNote_memos';
const CONFIG_KEY = 'myNote_config';

export const storageService = {
  getAllMemos(): Memo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getMemo(id: string): Memo | null {
    const memos = this.getAllMemos();
    return memos.find((m) => m.id === id) ?? null;
  },

  saveMemo(memo: Partial<Memo> & { id?: string }): Memo {
    const memos = this.getAllMemos();
    const now = new Date().toISOString();

    if (memo.id) {
      const index = memos.findIndex((m) => m.id === memo.id);
      if (index >= 0) {
        memos[index] = { ...memos[index], ...memo, updatedAt: now };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
        return memos[index];
      }
    }

    const newMemo: Memo = {
      id: memo.id ?? uuidv4(),
      title: memo.title ?? 'Untitled',
      content: memo.content ?? '',
      rawContent: memo.rawContent ?? '',
      tags: memo.tags ?? [],
      createdAt: now,
      updatedAt: now,
      attachments: memo.attachments ?? [],
      links: memo.links ?? [],
    };

    memos.unshift(newMemo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    return newMemo;
  },

  deleteMemo(id: string): void {
    const memos = this.getAllMemos().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
  },

  updateMemo(id: string, updates: Partial<Memo>): Memo | null {
    const memos = this.getAllMemos();
    const index = memos.findIndex((m) => m.id === id);
    if (index < 0) return null;
    memos[index] = { ...memos[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    return memos[index];
  },

  searchMemos(query: string): Memo[] {
    const q = query.toLowerCase();
    return this.getAllMemos().filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.rawContent.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  addAttachment(memoId: string, attachment: Attachment): Memo | null {
    const memo = this.getMemo(memoId);
    if (!memo) return null;
    return this.updateMemo(memoId, {
      attachments: [...memo.attachments, attachment],
    });
  },

  getConfig(): Record<string, string> {
    try {
      const data = localStorage.getItem(CONFIG_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setConfig(key: string, value: string): void {
    const config = this.getConfig();
    config[key] = value;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },
};
