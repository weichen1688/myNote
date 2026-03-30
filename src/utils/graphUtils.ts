import type { Memo } from '../types';

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Builds the knowledge-graph data structure from a list of memos.
 * Nodes = memos; links come from:
 *   1. Explicit memo.links references
 *   2. Shared tags between pairs of memos
 */
export function buildGraphData(memos: Memo[]): GraphData {
  const nodes: GraphNode[] = memos.map((m) => ({
    id: m.id,
    label: m.title || 'Untitled',
    group: m.tags[0] || 'default',
    size: Math.max(8, Math.min(22, 8 + m.rawContent.length / 100)),
  }));

  const links: GraphLink[] = [];
  const memoMap = new Map(memos.map((m) => [m.id, m]));

  // Explicit links
  memos.forEach((memo) => {
    memo.links.forEach((targetId) => {
      if (memoMap.has(targetId)) {
        links.push({ source: memo.id, target: targetId, strength: 0.8 });
      }
    });
  });

  // Shared-tag links  — O(n²) with Set lookups instead of O(n²·k)
  const tagSets = memos.map((m) => new Set(m.tags));
  for (let i = 0; i < memos.length; i++) {
    for (let j = i + 1; j < memos.length; j++) {
      const sharedCount = [...tagSets[i]].filter((t) => tagSets[j].has(t)).length;
      if (sharedCount > 0) {
        links.push({
          source: memos[i].id,
          target: memos[j].id,
          strength: 0.3 * sharedCount,
        });
      }
    }
  }

  return { nodes, links };
}
