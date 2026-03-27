import { describe, it, expect } from 'vitest';
import { buildGraphData } from '../utils/graphUtils';
import type { Memo } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMemo(overrides: Partial<Memo> & { id: string }): Memo {
  return {
    title: 'Untitled',
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

// ─── Nodes ────────────────────────────────────────────────────────────────────

describe('buildGraphData – nodes', () => {
  it('returns one node per memo', () => {
    const memos = [makeMemo({ id: '1' }), makeMemo({ id: '2' }), makeMemo({ id: '3' })];
    const { nodes } = buildGraphData(memos);
    expect(nodes).toHaveLength(3);
  });

  it('returns empty nodes for empty memos list', () => {
    const { nodes, links } = buildGraphData([]);
    expect(nodes).toHaveLength(0);
    expect(links).toHaveLength(0);
  });

  it('uses memo.id as node id', () => {
    const { nodes } = buildGraphData([makeMemo({ id: 'abc-123' })]);
    expect(nodes[0].id).toBe('abc-123');
  });

  it('uses memo.title as node label', () => {
    const { nodes } = buildGraphData([makeMemo({ id: '1', title: 'My Note' })]);
    expect(nodes[0].label).toBe('My Note');
  });

  it('falls back to "Untitled" when title is empty', () => {
    const { nodes } = buildGraphData([makeMemo({ id: '1', title: '' })]);
    expect(nodes[0].label).toBe('Untitled');
  });

  it('uses the first tag as the group', () => {
    const { nodes } = buildGraphData([makeMemo({ id: '1', tags: ['react', 'frontend'] })]);
    expect(nodes[0].group).toBe('react');
  });

  it('uses "default" group when memo has no tags', () => {
    const { nodes } = buildGraphData([makeMemo({ id: '1', tags: [] })]);
    expect(nodes[0].group).toBe('default');
  });

  it('computes size between 8 and 22', () => {
    const empty = makeMemo({ id: '1', rawContent: '' });
    const large = makeMemo({ id: '2', rawContent: 'x'.repeat(10_000) });
    const { nodes } = buildGraphData([empty, large]);
    expect(nodes[0].size).toBeGreaterThanOrEqual(8);
    expect(nodes[1].size).toBeLessThanOrEqual(22);
  });

  it('size grows proportionally with rawContent length (within bounds)', () => {
    const short = makeMemo({ id: '1', rawContent: 'x'.repeat(100) }); // size = 8 + 1 = 9
    const long = makeMemo({ id: '2', rawContent: 'x'.repeat(500) });  // size = min(22, 8+5) = 13
    const { nodes } = buildGraphData([short, long]);
    expect(nodes[1].size).toBeGreaterThan(nodes[0].size);
  });
});

// ─── Explicit links ───────────────────────────────────────────────────────────

describe('buildGraphData – explicit links', () => {
  it('creates a link for each valid memo.links entry', () => {
    const memos = [
      makeMemo({ id: 'a', links: ['b'] }),
      makeMemo({ id: 'b' }),
    ];
    const { links } = buildGraphData(memos);
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe('a');
    expect(links[0].target).toBe('b');
  });

  it('assigns strength 0.8 to explicit links', () => {
    const memos = [makeMemo({ id: 'a', links: ['b'] }), makeMemo({ id: 'b' })];
    const { links } = buildGraphData(memos);
    expect(links[0].strength).toBe(0.8);
  });

  it('ignores explicit links to memos that do not exist in the list', () => {
    const memos = [makeMemo({ id: 'a', links: ['ghost-id'] })];
    const { links } = buildGraphData(memos);
    expect(links).toHaveLength(0);
  });

  it('handles a memo linking to multiple targets', () => {
    const memos = [
      makeMemo({ id: 'a', links: ['b', 'c'] }),
      makeMemo({ id: 'b' }),
      makeMemo({ id: 'c' }),
    ];
    const { links } = buildGraphData(memos);
    const explicitLinks = links.filter((l) => l.strength === 0.8);
    expect(explicitLinks).toHaveLength(2);
  });
});

// ─── Shared-tag links ─────────────────────────────────────────────────────────

describe('buildGraphData – shared-tag links', () => {
  it('creates a link between two memos with a shared tag', () => {
    const memos = [
      makeMemo({ id: 'a', tags: ['react'] }),
      makeMemo({ id: 'b', tags: ['react', 'typescript'] }),
    ];
    const { links } = buildGraphData(memos);
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe('a');
    expect(links[0].target).toBe('b');
  });

  it('assigns strength 0.3 per shared tag', () => {
    const memos = [
      makeMemo({ id: 'a', tags: ['react', 'typescript'] }),
      makeMemo({ id: 'b', tags: ['react', 'typescript'] }),
    ];
    const { links } = buildGraphData(memos);
    expect(links).toHaveLength(1);
    expect(links[0].strength).toBeCloseTo(0.6); // 0.3 × 2 shared tags
  });

  it('does not create a link between memos with no shared tags', () => {
    const memos = [
      makeMemo({ id: 'a', tags: ['react'] }),
      makeMemo({ id: 'b', tags: ['python'] }),
    ];
    const { links } = buildGraphData(memos);
    expect(links).toHaveLength(0);
  });

  it('does not duplicate links (each pair is considered once)', () => {
    const memos = [
      makeMemo({ id: 'a', tags: ['react'] }),
      makeMemo({ id: 'b', tags: ['react'] }),
      makeMemo({ id: 'c', tags: ['react'] }),
    ];
    const { links } = buildGraphData(memos);
    // Three pairs: (a,b), (a,c), (b,c)
    expect(links).toHaveLength(3);
  });

  it('combines explicit and shared-tag links', () => {
    const memos = [
      makeMemo({ id: 'a', tags: ['react'], links: ['b'] }),
      makeMemo({ id: 'b', tags: ['react'] }),
    ];
    const { links } = buildGraphData(memos);
    // 1 explicit + 1 tag-based
    expect(links).toHaveLength(2);
  });
});
