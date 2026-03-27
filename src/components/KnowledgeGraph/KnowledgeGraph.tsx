import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { Memo } from '../../types';
import type { KnowledgeNode } from '../../types';
import { buildGraphData } from '../../utils/graphUtils';
import './KnowledgeGraph.css';

interface KnowledgeGraphProps {
  memos: Memo[];
  selectedMemoId: string | null;
  onSelectMemo: (memo: Memo) => void;
}

interface SimNode extends KnowledgeNode, d3.SimulationNodeDatum {
  x?: number;
  y?: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  strength?: number;
}

export default function KnowledgeGraph({ memos, selectedMemoId, onSelectMemo }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const buildGraph = useCallback((): { nodes: SimNode[]; links: SimLink[] } => {
    return buildGraphData(memos) as { nodes: SimNode[]; links: SimLink[] };
  }, [memos]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || memos.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add zoom
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform)),
    );

    const { nodes, links } = buildGraph();

    // Color scale by group/tag
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(80).strength((d) => (d.strength ?? 0.5)))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => (d.size ?? 10) + 5));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Draw node groups
    const nodeGroup = (g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g') as d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>)
      .attr('class', 'graph-node-group')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      )
      .on('click', (_, d) => {
        const memo = memos.find((m) => m.id === d.id);
        if (memo) onSelectMemo(memo);
      });

    // Node circle
    nodeGroup.append('circle')
      .attr('r', (d) => d.size ?? 10)
      .attr('fill', (d) => colorScale(d.group ?? 'default'))
      .attr('stroke', (d) => d.id === selectedMemoId ? '#fff' : 'transparent')
      .attr('stroke-width', 2)
      .attr('opacity', 0.85);

    // Node label
    nodeGroup.append('text')
      .attr('dy', (d) => -(d.size ?? 10) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#ccc')
      .attr('font-family', 'sans-serif')
      .text((d) => d.label.length > 20 ? d.label.slice(0, 18) + '…' : d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);

      nodeGroup.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [memos, selectedMemoId, buildGraph, onSelectMemo]);

  return (
    <div className="knowledge-graph" ref={containerRef}>
      <div className="graph-header">
        <span className="graph-title">Knowledge Graph</span>
        <span className="graph-stats">{memos.length} notes</span>
      </div>
      {memos.length === 0 ? (
        <div className="graph-empty">
          <p>No notes yet. Create some notes to see the knowledge graph.</p>
        </div>
      ) : (
        <svg ref={svgRef} className="graph-svg" />
      )}
      <div className="graph-hint">
        Click a node to open the note · Drag to rearrange · Scroll to zoom
      </div>
    </div>
  );
}
