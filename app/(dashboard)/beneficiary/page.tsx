"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { Search, Users, CheckCircle, AlertTriangle, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["All Districts", "Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];

export default function BeneficiaryDiscoveryPage() {
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const runDiscovery = useCallback(async () => {
    setLoading(true);
    try {
      const district = selectedDistrict === "All Districts" ? undefined : selectedDistrict;
      const res = await api.discoverBeneficiaries(district);
      setResult(res);
      toast.success(`Found ${res.eligible_count} eligible beneficiaries`);
    } catch (e) {
      toast.error("Discovery engine failed. Check backend connection.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    runDiscovery();
  }, [runDiscovery]);

  const candidates = result?.list_of_candidates ?? [];
  const highConf = candidates.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.status === "high_confidence"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Beneficiary Discovery Engine</h1>
        <p className="text-slate-500 text-sm mt-1">
          Proactively identifies eligible but unenrolled citizens for widow pension and welfare schemes.
        </p>
      </div>

      {/* Filter + Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center space-x-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <Search size={16} className="text-slate-400" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button
          onClick={runDiscovery}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? "Scanning..." : "Run Discovery"}
        </button>
      </div>

      {/* Summary Cards */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{result.total_scanned?.toLocaleString()}</p>
              <p className="text-xs font-medium text-slate-500">Citizens Scanned</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-amber-500" size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{result.eligible_count}</p>
              <p className="text-xs font-medium text-slate-500">Eligible Candidates</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{result.high_confidence_count}</p>
              <p className="text-xs font-medium text-slate-500">High Confidence</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            Eligible Candidates
          </h2>
          {result && (
            <span className="text-xs text-slate-500 font-mono">
              District: {result.district}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-8 animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-sm">No eligible candidates found for the selected district.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {candidates.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (c: any, i: number) => (
                <div key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{c.name}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            c.status === "high_confidence"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {c.status === "high_confidence" ? "High Confidence" : "Low Confidence"}
                        </span>
                        {c.ration_match_found && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            Ration ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        {c.aadhaar_id} • {c.district} • Income: ₹{c.income?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-400">{c.explainability_reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-xl font-bold"
                        style={{
                          color: c.confidence_score >= 70 ? "#16a34a" : "#d97706",
                        }}
                      >
                        {c.confidence_score}%
                      </div>
                      <div className="text-xs text-slate-400">Confidence</div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* High Confidence Summary */}
      {highConf.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-green-800 mb-2">
            ✅ {highConf.length} citizens are ready for direct enrollment
          </h3>
          <p className="text-xs text-green-700">
            These candidates have been cross-validated with Aadhaar, death records, and ration card
            databases with high confidence. Recommend initiating scheme enrollment workflow.
          </p>
        </div>
      )}
    </div>
  );
}
