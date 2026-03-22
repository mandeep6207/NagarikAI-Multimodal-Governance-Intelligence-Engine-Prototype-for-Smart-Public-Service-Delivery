"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";

type GraphNode = {
  id: string;
  label: string;
  type: string;
};

type GraphEdge = {
  source: string;
  target: string;
  label: string;
};

type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type PositionedNode = GraphNode & { x: number; y: number };

const nodeColor: Record<string, string> = {
  district: "#2563EB",
  dept: "#7C3AED",
  officer: "#0F766E",
  grievance: "#DC2626",
  citizen: "#059669",
};

export default function AnalystGraphPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GraphResponse | null>(null);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchKnowledgeGraph();
      setData(res);
    } catch {
      setError("Failed to fetch analyst graph data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nodes: PositionedNode[] = (data?.nodes || []).map((node, index, arr) => {
    const angle = (index / Math.max(arr.length, 1)) * Math.PI * 2;
    const ring = 160 + ((index % 5) * 35);
    return {
      ...node,
      x: 420 + Math.cos(angle) * ring,
      y: 260 + Math.sin(angle) * ring,
    };
  });

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const onWheelZoom = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((s) => Math.max(0.4, Math.min(2.4, Number((s + delta).toFixed(2)))));
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    setLastPoint({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !lastPoint) return;
    const dx = e.clientX - lastPoint.x;
    const dy = e.clientY - lastPoint.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    setLastPoint({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    setDragging(false);
    setLastPoint(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Knowledge Entities</h1>
          <p className="text-slate-500 text-sm mt-1">Department intelligence graph and linked grievance entities.</p>
        </div>
        <button onClick={loadData} className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Entity Count</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.nodes.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Edge Count</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.edges.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Top Entity Type</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{data.nodes[0]?.type || "N/A"}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-700">Interactive Knowledge Graph</p>
                <div className="flex gap-2">
                  <button onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))} className="px-2 py-1 text-xs bg-slate-100 rounded">-</button>
                  <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="px-2 py-1 text-xs bg-slate-100 rounded">Reset</button>
                  <button onClick={() => setScale((s) => Math.min(2.4, Number((s + 0.1).toFixed(2))))} className="px-2 py-1 text-xs bg-slate-100 rounded">+</button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-950/95">
                <svg
                  viewBox="0 0 900 520"
                  className="w-full h-[420px] cursor-grab"
                  onWheel={onWheelZoom}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                    {data.edges.slice(0, 320).map((edge, idx) => {
                      const source = nodeMap[edge.source];
                      const target = nodeMap[edge.target];
                      if (!source || !target) return null;
                      return <line key={`${edge.source}-${edge.target}-${idx}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#334155" strokeWidth={1} opacity={0.75} />;
                    })}
                    {nodes.map((node) => (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onMouseEnter={() => setHovered(node)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <circle r={node.type === "district" ? 13 : 9} fill={nodeColor[node.type] || "#94A3B8"} opacity={0.95} />
                        <text x={12} y={4} fontSize={10} fill="#E2E8F0">{node.label.slice(0, 16)}</text>
                      </g>
                    ))}
                  </g>
                </svg>
              </div>
              <p className="text-xs text-slate-500 mt-2">Use mouse wheel to zoom and drag to pan. Colors represent entity types.</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Relationship Trails</p>
              {hovered && (
                <div className="text-sm mb-3 bg-blue-50 border border-blue-200 rounded px-3 py-2 text-blue-900">
                  Focus: <span className="font-semibold">{hovered.label}</span> ({hovered.type})
                </div>
              )}
              <div className="space-y-2">
                {data.edges.slice(0, 40).map((edge, idx) => (
                  <div key={`${idx}-${edge.source}-${edge.target}`} className="text-sm text-slate-700 bg-slate-50 rounded px-3 py-2">
                    {edge.source} → {edge.target}
                    <span className="text-slate-500"> ({edge.label})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
