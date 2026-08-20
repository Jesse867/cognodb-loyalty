'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  tier: string;
  points: number;
  role: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface ReferralGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#94a3b8',
  Gold: '#fbbf24',
  VIP: '#8b5cf6',
};

export function ReferralGraph({ data, width = 800, height = 500 }: ReferralGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create a map for node lookup
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    // Process links to use node references
    const links = data.links.map(l => ({
      source: nodeMap.get(l.source)!,
      target: nodeMap.get(l.target)!,
    }));

    // Simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Draw nodes
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(data.nodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', (d: GraphNode) => d.role === 'root' ? 22 : 16)
      .attr('fill', (d: GraphNode) => TIER_COLORS[d.tier] || '#64748b')
      .attr('stroke', (d: GraphNode) => d.role === 'root' ? '#1e293b' : '#fff')
      .attr('stroke-width', (d: GraphNode) => d.role === 'root' ? 3 : 2)
      .on('mouseover', (event, d: GraphNode) => {
        setTooltip({
          x: event.pageX + 10,
          y: event.pageY - 10,
          content: `<strong>${d.name}</strong><br/>Tier: ${d.tier}<br/>Points: ${d.points?.toLocaleString() || 0}`,
        });
      })
      .on('mousemove', (event) => {
        setTooltip(prev => prev ? { ...prev, x: event.pageX + 10, y: event.pageY - 10 } : null);
      })
      .on('mouseout', () => setTooltip(null));

    // Node labels
    node.append('text')
      .text((d: GraphNode) => d.name.split(' ')[0])
      .attr('text-anchor', 'middle')
      .attr('dy', (d: GraphNode) => d.role === 'root' ? 35 : 28)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', '#475569')
      .style('pointer-events', 'none');

    // Root label
    node.filter((d: GraphNode) => d.role === 'root')
      .append('text')
      .text('ROOT')
      .attr('text-anchor', 'middle')
      .attr('dy', -28)
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('fill', '#1e293b')
      .style('pointer-events', 'none');

    // Tick function
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom as any);

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy as any, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy as any, 0.7);
    }
  };

  const handleReset = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.transform as any, d3.zoomIdentity);
    }
  };

  if (!data.nodes.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No referral network data available.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Referral Network</h3>
        <div className="flex items-center gap-1">
          <button onClick={handleZoomIn} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#cd7f32]" /> Bronze
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#94a3b8]" /> Silver
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#fbbf24]" /> Gold
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" /> VIP
        </div>
      </div>
    </div>
  );
}
