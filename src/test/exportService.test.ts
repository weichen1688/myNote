/**
 * Tests for exportService.exportToMarkdown
 *
 * The full exportToPDF / printMemo functions require a real canvas / browser
 * window context that jsdom cannot provide, so we focus on the DOM-based
 * markdown converter which is the critical business-logic path and was the
 * subject of a CodeQL security fix (replacing regex with DOM parsing).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportService } from '../services/export';
import type { Memo } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMemo(overrides: Partial<Memo> = {}): Memo {
  return {
    id: 'test-id',
    title: 'Test Note',
    content: '',
    rawContent: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    links: [],
    ...overrides,
  };
}

// Capture the real createElement ONCE before any spies are installed
const realCreateElement = document.createElement.bind(document);

// Capture what gets downloaded without actually navigating
let lastBlob: Blob | null = null;
let lastFilename: string | null = null;

beforeEach(() => {
  lastBlob = null;
  lastFilename = null;

  // jsdom doesn't support createObjectURL; stub it
  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      lastBlob = blob;
      return 'blob://stub';
    },
    revokeObjectURL: vi.fn(),
  });

  // Intercept <a>.click() so we can read the download attribute.
  // Use the real createElement captured at module scope to avoid recursion.
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreateElement(tag);
    if (tag === 'a') {
      vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {
        lastFilename = (el as HTMLAnchorElement).download;
      });
    }
    return el;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function getMarkdown(memo: Memo): Promise<string> {
  exportService.exportToMarkdown(memo);
  return lastBlob ? await lastBlob.text() : '';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('exportService.exportToMarkdown – headings', () => {
  it('converts h1 to # heading', async () => {
    const md = await getMarkdown(makeMemo({ content: '<h1>Title One</h1>' }));
    expect(md).toContain('# Title One');
  });

  it('converts h2 to ## heading', async () => {
    const md = await getMarkdown(makeMemo({ content: '<h2>Subtitle</h2>' }));
    expect(md).toContain('## Subtitle');
  });

  it('converts h3 to ### heading', async () => {
    const md = await getMarkdown(makeMemo({ content: '<h3>Section</h3>' }));
    expect(md).toContain('### Section');
  });

  it('converts h4–h6 to #### heading', async () => {
    const md = await getMarkdown(makeMemo({ content: '<h4>Sub</h4><h5>Sub2</h5>' }));
    expect(md).toContain('#### Sub');
    expect(md).toContain('#### Sub2');
  });
});

describe('exportService.exportToMarkdown – inline formatting', () => {
  it('converts <strong> to **bold**', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p><strong>bold text</strong></p>' }));
    expect(md).toContain('**bold text**');
  });

  it('converts <em> to *italic*', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p><em>italic text</em></p>' }));
    expect(md).toContain('*italic text*');
  });

  it('converts <u> to _underline_', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p><u>underline</u></p>' }));
    expect(md).toContain('_underline_');
  });

  it('converts <s> to ~~strikethrough~~', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p><s>strike</s></p>' }));
    expect(md).toContain('~~strike~~');
  });

  it('converts <code> to `code`', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p><code>const x = 1</code></p>' }));
    expect(md).toContain('`const x = 1`');
  });
});

describe('exportService.exportToMarkdown – block elements', () => {
  it('converts <p> to paragraph followed by double newline', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p>Hello world</p><p>Second</p>' }));
    // The service trims the final content, so only interior \n\n (between paras) is preserved
    expect(md).toContain('Hello world\n\nSecond');
  });

  it('converts <ul><li> to - list items', async () => {
    const md = await getMarkdown(makeMemo({ content: '<ul><li>Item 1</li><li>Item 2</li></ul>' }));
    expect(md).toContain('- Item 1');
    expect(md).toContain('- Item 2');
  });

  it('converts <ol><li> to - list items', async () => {
    const md = await getMarkdown(makeMemo({ content: '<ol><li>First</li><li>Second</li></ol>' }));
    expect(md).toContain('- First');
    expect(md).toContain('- Second');
  });

  it('converts <blockquote> to > lines', async () => {
    const md = await getMarkdown(makeMemo({ content: '<blockquote>quoted text</blockquote>' }));
    expect(md).toContain('> quoted text');
  });

  it('converts <pre> to fenced code block', async () => {
    const md = await getMarkdown(makeMemo({ content: '<pre>code block</pre>' }));
    expect(md).toContain('```\ncode block\n```');
  });

  it('converts <hr> to ---', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p>A</p><hr><p>B</p>' }));
    expect(md).toContain('---');
  });

  it('converts <br> to newline', async () => {
    const md = await getMarkdown(makeMemo({ content: '<p>line1<br>line2</p>' }));
    expect(md).toContain('line1\nline2');
  });
});

describe('exportService.exportToMarkdown – links and images', () => {
  it('converts <a> to [text](href)', async () => {
    const md = await getMarkdown(makeMemo({ content: '<a href="https://example.com">Click here</a>' }));
    expect(md).toContain('[Click here](https://example.com)');
  });

  it('converts <img> to ![alt](src)', async () => {
    const md = await getMarkdown(makeMemo({ content: '<img src="photo.png" alt="A photo">' }));
    expect(md).toContain('![A photo](photo.png)');
  });

  it('handles <img> with no alt attribute', async () => {
    const md = await getMarkdown(makeMemo({ content: '<img src="pic.jpg">' }));
    expect(md).toContain('![](pic.jpg)');
  });
});

describe('exportService.exportToMarkdown – document structure', () => {
  it('always starts with # title from memo.title', async () => {
    const md = await getMarkdown(makeMemo({ title: 'My Great Note', content: '<p>content</p>' }));
    expect(md.startsWith('# My Great Note')).toBe(true);
  });

  it('handles entirely empty content gracefully', async () => {
    const md = await getMarkdown(makeMemo({ title: 'Empty', content: '' }));
    // The service produces `# Empty\n\n` (title + \n\n + empty trimmed content)
    expect(md.trim()).toBe('# Empty');
  });

  it('handles HTML entities correctly via DOM (no double-unescaping)', async () => {
    // The DOM parser automatically decodes &amp; → & when setting innerHTML
    const md = await getMarkdown(makeMemo({ content: '<p>a &amp; b &lt;c&gt;</p>' }));
    expect(md).toContain('a & b <c>');
    // Must NOT produce double-decoded output like &&amp; etc.
    expect(md).not.toContain('&amp;');
  });

  it('uses memo.title for the download filename', () => {
    exportService.exportToMarkdown(makeMemo({ title: 'My Note!' }));
    expect(lastFilename).toBe('My_Note_.md');
  });

  it('strips special characters from filename', () => {
    exportService.exportToMarkdown(makeMemo({ title: 'Hello / World: Test?' }));
    expect(lastFilename).toBe('Hello___World__Test_.md');
  });

  it('produces a Blob with text/markdown MIME type', () => {
    exportService.exportToMarkdown(makeMemo({ content: '<p>hi</p>' }));
    expect(lastBlob).not.toBeNull();
    expect(lastBlob!.type).toBe('text/markdown');
  });
});

describe('exportService.exportToMarkdown – tables', () => {
  it('converts a simple table with header and data rows', async () => {
    const content = `
      <table>
        <tr><th>Name</th><th>Value</th></tr>
        <tr><td>Alpha</td><td>1</td></tr>
        <tr><td>Beta</td><td>2</td></tr>
      </table>
    `;
    const md = await getMarkdown(makeMemo({ content }));
    expect(md).toContain('| Name | Value |');
    expect(md).toContain('| Alpha | 1 |');
    expect(md).toContain('| Beta | 2 |');
  });

  it('each row ends with a single | and does not produce double ||', async () => {
    const content = '<table><tr><td>A</td><td>B</td></tr></table>';
    const md = await getMarkdown(makeMemo({ content }));
    // Should not contain a "| |" pattern (the old double-pipe bug)
    expect(md).not.toMatch(/\| \|/);
    expect(md).toContain('| A | B |');
  });
});

describe('exportService.exportToMarkdown – complex mixed content', () => {
  it('converts a realistic note with multiple elements', async () => {
    const content = `
      <h1>Introduction</h1>
      <p>This is <strong>important</strong> and <em>interesting</em>.</p>
      <ul>
        <li>Point A</li>
        <li>Point B with <code>code</code></li>
      </ul>
      <blockquote>A wise quote</blockquote>
      <a href="https://example.com">Learn more</a>
    `;
    const md = await getMarkdown(makeMemo({ title: 'Overview', content }));
    expect(md).toContain('# Introduction');
    expect(md).toContain('**important**');
    expect(md).toContain('*interesting*');
    expect(md).toContain('- Point A');
    expect(md).toContain('`code`');
    expect(md).toContain('> A wise quote');
    expect(md).toContain('[Learn more](https://example.com)');
  });
});
