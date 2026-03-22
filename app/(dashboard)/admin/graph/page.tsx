"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import SectionDivider from "../../../components/gov/SectionDivider";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

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

export default function AdminGraphPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GraphResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchKnowledgeGraph();
      setData(res);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setError("Failed to fetch knowledge graph data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const edgeRows = data.edges.map((edge) => [edge.source, edge.target, edge.label]);
    const csv = [["Source", "Target", "Relation"], ...edgeRows]
      .map((row) => row.map((cell) => `"${String(cell)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "knowledge_graph_edges.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const typeCount = data
    ? Object.entries(
        data.nodes.reduce<Record<string, number>>((acc, node) => {
          acc[node.type] = (acc[node.type] || 0) + 1;
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] tracking-tight">Knowledge Graph Intelligence Report</h1>
          <p className="text-slate-600 text-sm mt-1">Last Updated: {lastUpdated} • Data Source: Knowledge Graph Service</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="gov-btn-secondary">Refresh Data</button>
          <button onClick={exportCsv} className="gov-btn-primary">Export CSV</button>
        </div>
      </div>

      <section className="gov-card p-5">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-5">
            <SectionDivider title="Summary KPIs" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Entities</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.nodes.length}</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Relationships</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.edges.length}</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Unique Types</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{new Set(data.nodes.map((n) => n.type)).size}</p>
              </div>
            </div>

            <SectionDivider title="Detailed MIS Table" />
            <div className="overflow-x-auto border border-[#cfd6e3] max-h-80">
              <table className="gov-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Source Entity</th>
                    <th>Target Entity</th>
                    <th>Relationship</th>
                  </tr>
                </thead>
                <tbody>
                  {data.edges.slice(0, 120).map((edge, idx) => (
                    <tr key={`${edge.source}-${edge.target}-${idx}`}>
                      <td>{edge.source}</td>
                      <td>{edge.target}</td>
                      <td>{edge.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionDivider title="Analytical Visual" />
            <div className="gov-card p-4 border-[#cfd6e3]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Node Type Distribution</h3>
                <button onClick={exportCsv} className="gov-btn-secondary">Export CSV</button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={typeCount} dataKey="value" nameKey="name" outerRadius={95} label>
                    {typeCount.map((_, idx) => (
                      <Cell key={idx} fill={["#0B3C5D", "#138808", "#FF9933", "#C62828", "#607D8B"][idx % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">Data Source: Knowledge Graph Service • Legend included • Timestamp: {lastUpdated}</p>
            </div>

            <SectionDivider title="Formal Remarks" />
            <div className="border border-[#d3dbe7] bg-[#f8fbff] p-4 text-sm text-slate-700">
              Graph linkage integrity is operational. Relationship mapping supports inter-departmental escalation analysis and district intelligence coordination.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
