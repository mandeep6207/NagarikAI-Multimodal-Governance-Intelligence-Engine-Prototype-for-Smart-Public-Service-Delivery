"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, ShieldCheck, Users, BarChart3, User } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import Emblem from "../../components/gov/Emblem";
import { getRoleHome } from "../../config/roleConfig";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("super_admin");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("demo.user");
  const [password, setPassword] = useState("demo");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(username, password, selectedRole);
      localStorage.setItem("authToken", res.token);
      localStorage.setItem("userRole", res.role);
      localStorage.setItem("userName", res.name);
      localStorage.setItem("userDistrict", res.district || "");
      if (res.citizen_id) localStorage.setItem("citizenId", res.citizen_id);

      toast.success(`Authenticated as ${res.name}`);
      router.push(getRoleHome(selectedRole));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gov-shell flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl gov-card grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="bg-[#0B3C5D] text-white p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 border border-white/70 rounded-full flex items-center justify-center">
              <Emblem className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xs tracking-wider uppercase text-white/80">Government of Chhattisgarh</div>
              <div className="text-sm font-semibold">NagarikAI Governance Intelligence Portal</div>
            </div>
          </div>
          <h1 className="text-2xl font-semibold leading-tight">Official Personnel Authentication</h1>
          <p className="text-sm text-white/85 mt-3 leading-7">
            Access is restricted to authorized officers and approved administrative operators. All sessions are monitored under departmental digital governance policy.
          </p>
          <div className="mt-6 text-xs border border-white/30 bg-white/10 p-3">
            Authorized Personnel Only • Secure Administrative Access Channel
          </div>
        </div>

        <div className="p-8 lg:p-10 bg-white">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#0B3C5D]">Sign In</h2>
            <p className="text-sm text-slate-600">Provide official credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full border border-[#cfd6e3] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3C5D]"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-[#cfd6e3] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0B3C5D]"
              />
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700">Operating Role</label>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "super_admin", title: "Super Administrator", icon: ShieldCheck, desc: "State governance authority" },
                  { id: "district_officer", title: "District Officer", icon: Users, desc: "District operations and escalations" },
                  { id: "csc_operator", title: "CSC Operator", icon: Fingerprint, desc: "Citizen service processing" },
                  { id: "analyst", title: "Department Analyst", icon: BarChart3, desc: "Analytical oversight and reporting" },
                  { id: "citizen", title: "Citizen Self-Service", icon: User, desc: "Access government services directly" }
                ].map((role) => (
                  <label 
                    key={role.id}
                    className={`flex items-center p-3 border cursor-pointer ${
                      selectedRole === role.id 
                      ? "border-[#0B3C5D] bg-[#eef3f8]" 
                      : "border-[#d6dde8] hover:bg-slate-50"
                    }`}
                  >
                    <input type="radio" name="role" value={role.id} checked={selectedRole === role.id} onChange={() => setSelectedRole(role.id)} className="hidden" />
                    <role.icon className={`${selectedRole === role.id ? "text-[#0B3C5D]" : "text-slate-500"} mr-3`} size={18} />
                    <div>
                      <h4 className={`font-semibold text-sm ${selectedRole === role.id ? "text-[#0B3C5D]" : "text-slate-700"}`}>{role.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full gov-btn-primary disabled:bg-slate-400 text-white py-2.5 font-semibold flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authentication in progress...</span>
                </>
              ) : (
                <span>Proceed to Portal</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            This portal is governed by official information security protocols.
          </p>
        </div>
      </div>
    </div>
  );
}
