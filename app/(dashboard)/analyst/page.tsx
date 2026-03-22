"use client";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import SectionDivider from "../../components/gov/SectionDivider";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

type GraphNode = { id: string; type: string; label: string };
type GraphEdge = { source: string; target: string; label?: string };  // API sends 'label' not 'relation'
type GraphResponse = { nodes: GraphNode[]; edges: GraphEdge[] };

export default function AnalystDashboard() {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.fetchKnowledgeGraph();
      setGraphData(data);
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      console.error("Knowledge graph fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!graphData) return;
    const rows = graphData.edges.map((edge) => [edge.source, edge.target, edge.label || "linked_to"]);
    const csv = [["Source", "Target", "Relation"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analyst_knowledge_graph_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const nodeCounts = (graphData?.nodes || []).reduce<Record<string, number>>((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});

  const typePieData = Object.entries(nodeCounts).map(([name, value]) => ({ name, value }));
  const totalNodes = graphData?.nodes?.length || 0;
  const totalEdges = graphData?.edges?.length || 0;
  const riskScore = totalNodes > 0 ? ((totalEdges / totalNodes) * 10).toFixed(1) : "0.0";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] tracking-tight">Department Analyst Intelligence Report</h1>
          <p className="text-slate-600 text-sm mt-1">Last Updated: {lastUpdated} • Data Source: Knowledge Graph Service</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchGraph} className="gov-btn-secondary">Refresh</button>
          <button onClick={exportCsv} className="gov-btn-primary">Export CSV</button>
        </div>
      </div>

      <section className="gov-card p-5">
        {loading && <p className="text-slate-500">Loading graph data...</p>}
        {!loading && graphData && (
          <div className="space-y-5">
            <SectionDivider title="Summary KPIs" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Total Nodes</p><p className="text-2xl font-bold text-slate-800 mt-1">{totalNodes}</p></div>
              <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Total Edges</p><p className="text-2xl font-bold text-slate-800 mt-1">{totalEdges}</p></div>
              <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Node Types</p><p className="text-2xl font-bold text-slate-800 mt-1">{Object.keys(nodeCounts).length}</p></div>
              <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Leakage Risk Index</p><p className="text-2xl font-bold text-[#C62828] mt-1">{riskScore}</p></div>
            </div>

            <SectionDivider title="Detailed MIS Table" />
            <div className="overflow-x-auto border border-[#cfd6e3]">
              <table className="gov-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Target</th>
                    <th>Relation</th>
                  </tr>
                </thead>
                <tbody>
                  {graphData.edges.slice(0, 12).map((edge, index) => (
                    <tr key={`${edge.source}-${edge.target}-${index}`}>
                      <td>{edge.source}</td>
                      <td>{edge.target}</td>
                      <td>{edge.label || "linked_to"}</td>
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
                  <Pie data={typePieData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {typePieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={["#0B3C5D", "#1E88E5", "#2E7D32", "#F57C00", "#C62828"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">Data Source: Knowledge Graph Service • Legend included • Timestamp: {lastUpdated}</p>
            </div>

            <SectionDivider title="Formal Remarks" />
            <div className="border border-[#d3dbe7] bg-[#f8fbff] p-4 text-sm text-slate-700 space-y-2">
              <p>Network density indicates relationship concentration useful for anomaly triaging and scheme conflict detection.</p>
              <p>Recommended next review set: high-degree citizen nodes and cross-scheme links with elevated complaint overlap.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
