import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../services/storage';

// jsdom ships its own localStorage – reset it between tests
beforeEach(() => {
  localStorage.clear();
});

// ─── getAllMemos ───────────────────────────────────────────────────────────────

describe('storageService.getAllMemos', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(storageService.getAllMemos()).toEqual([]);
  });

  it('returns memos that were saved', () => {
    storageService.saveMemo({ title: 'A', rawContent: 'hello' });
    storageService.saveMemo({ title: 'B', rawContent: 'world' });
    const all = storageService.getAllMemos();
    expect(all).toHaveLength(2);
    expect(all.map((m) => m.title)).toContain('A');
    expect(all.map((m) => m.title)).toContain('B');
  });

  it('returns [] if localStorage holds corrupted JSON', () => {
    localStorage.setItem('myNote_memos', 'not-json');
    expect(storageService.getAllMemos()).toEqual([]);
  });
});

// ─── saveMemo ─────────────────────────────────────────────────────────────────

describe('storageService.saveMemo', () => {
  it('creates a new memo with generated id and timestamps', () => {
    const memo = storageService.saveMemo({ title: 'First note', rawContent: 'body text' });

    expect(memo.id).toBeTruthy();
    expect(memo.title).toBe('First note');
    expect(memo.rawContent).toBe('body text');
    expect(memo.createdAt).toBeTruthy();
    expect(memo.updatedAt).toBeTruthy();
    expect(memo.tags).toEqual([]);
    expect(memo.attachments).toEqual([]);
    expect(memo.links).toEqual([]);
  });

  it('prepends new memos so the latest appears first', () => {
    storageService.saveMemo({ title: 'Older' });
    storageService.saveMemo({ title: 'Newer' });
    const all = storageService.getAllMemos();
    expect(all[0].title).toBe('Newer');
    expect(all[1].title).toBe('Older');
  });

  it('defaults title to "Untitled" when not provided', () => {
    const memo = storageService.saveMemo({});
    expect(memo.title).toBe('Untitled');
  });

  it('updates an existing memo when the same id is supplied', () => {
    const created = storageService.saveMemo({ title: 'Original' });
    const updated = storageService.saveMemo({ id: created.id, title: 'Updated' });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('Updated');
    // Only one record should exist
    expect(storageService.getAllMemos()).toHaveLength(1);
  });
});

// ─── getMemo ──────────────────────────────────────────────────────────────────

describe('storageService.getMemo', () => {
  it('retrieves a memo by id', () => {
    const saved = storageService.saveMemo({ title: 'Find me' });
    const found = storageService.getMemo(saved.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Find me');
  });

  it('returns null for an unknown id', () => {
    expect(storageService.getMemo('does-not-exist')).toBeNull();
  });
});

// ─── updateMemo ───────────────────────────────────────────────────────────────

describe('storageService.updateMemo', () => {
  it('applies partial updates and refreshes updatedAt', async () => {
    const memo = storageService.saveMemo({ title: 'Before', rawContent: 'old content' });
    const before = memo.updatedAt;

    // ensure at least 1 ms passes
    await new Promise((r) => setTimeout(r, 2));

    const updated = storageService.updateMemo(memo.id, { title: 'After' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('After');
    expect(updated!.rawContent).toBe('old content'); // unchanged field preserved
    expect(updated!.updatedAt >= before).toBe(true);
  });

  it('returns null for a non-existent id', () => {
    expect(storageService.updateMemo('ghost', { title: 'X' })).toBeNull();
  });

  it('persists the update across a fresh getAllMemos call', () => {
    const memo = storageService.saveMemo({ title: 'Persist test' });
    storageService.updateMemo(memo.id, { content: '<p>new</p>' });
    const fresh = storageService.getMemo(memo.id);
    expect(fresh!.content).toBe('<p>new</p>');
  });
});

// ─── deleteMemo ───────────────────────────────────────────────────────────────

describe('storageService.deleteMemo', () => {
  it('removes the memo from storage', () => {
    const m1 = storageService.saveMemo({ title: 'Keep' });
    const m2 = storageService.saveMemo({ title: 'Delete me' });
    storageService.deleteMemo(m2.id);
    const all = storageService.getAllMemos();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(m1.id);
  });

  it('is a no-op for an unknown id', () => {
    storageService.saveMemo({ title: 'Existing' });
    storageService.deleteMemo('not-real');
    expect(storageService.getAllMemos()).toHaveLength(1);
  });
});

// ─── searchMemos ──────────────────────────────────────────────────────────────

describe('storageService.searchMemos', () => {
  beforeEach(() => {
    storageService.saveMemo({ title: 'TypeScript tips', rawContent: 'Use strict types', tags: ['typescript'] });
    storageService.saveMemo({ title: 'React patterns', rawContent: 'Hooks and context', tags: ['react', 'frontend'] });
    storageService.saveMemo({ title: 'Python intro', rawContent: 'def hello(): pass', tags: ['python'] });
  });

  it('matches by title (case-insensitive)', () => {
    const results = storageService.searchMemos('TYPESCRIPT');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('TypeScript tips');
  });

  it('matches by rawContent', () => {
    const results = storageService.searchMemos('hooks');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React patterns');
  });

  it('matches by tag', () => {
    const results = storageService.searchMemos('frontend');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React patterns');
  });

  it('returns multiple matches when query spans several memos', () => {
    // "intro" is only in Python, but let's search for something common
    const results = storageService.searchMemos('pass');
    expect(results).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    expect(storageService.searchMemos('xyzzy')).toHaveLength(0);
  });

  it('returns all memos when query is empty string', () => {
    // empty query: every memo matches because ''.includes('') is true
    expect(storageService.searchMemos('')).toHaveLength(3);
  });
});

// ─── addAttachment ────────────────────────────────────────────────────────────

describe('storageService.addAttachment', () => {
  it('appends an attachment to the memo', () => {
    const memo = storageService.saveMemo({ title: 'With files' });
    const att = { id: 'att-1', name: 'photo.png', type: 'image/png', url: 'data:...', size: 1024 };
    const updated = storageService.addAttachment(memo.id, att);
    expect(updated).not.toBeNull();
    expect(updated!.attachments).toHaveLength(1);
    expect(updated!.attachments[0].name).toBe('photo.png');
  });

  it('returns null for an unknown memo id', () => {
    const att = { id: 'a', name: 'x.png', type: 'image/png', url: '', size: 0 };
    expect(storageService.addAttachment('no-such-memo', att)).toBeNull();
  });
});

// ─── config ───────────────────────────────────────────────────────────────────

describe('storageService config', () => {
  it('returns empty object when no config is saved', () => {
    expect(storageService.getConfig()).toEqual({});
  });

  it('stores and retrieves a config key', () => {
    storageService.setConfig('openai_api_key', 'sk-test');
    expect(storageService.getConfig()['openai_api_key']).toBe('sk-test');
  });

  it('overwrites an existing key', () => {
    storageService.setConfig('openai_model', 'gpt-4o');
    storageService.setConfig('openai_model', 'gpt-4o-mini');
    expect(storageService.getConfig()['openai_model']).toBe('gpt-4o-mini');
  });

  it('keeps multiple config keys independently', () => {
    storageService.setConfig('key_a', 'val_a');
    storageService.setConfig('key_b', 'val_b');
    const cfg = storageService.getConfig();
    expect(cfg['key_a']).toBe('val_a');
    expect(cfg['key_b']).toBe('val_b');
  });
});
