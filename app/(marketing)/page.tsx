"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/* ─── DATA ─────────────────────────────────────────────────── */
const SLIDES = [
  {
    id: 1,
    label:   "Digital Governance Infrastructure",
    heading: "AI-Enabled Governance Intelligence for\nPublic Service Delivery in Chhattisgarh",
    sub:     "Harnessing artificial intelligence to strengthen administration, citizen welfare, and district monitoring.",
    image:   "/banners/banner 1.jpeg",
  },
  {
    id: 2,
    label:   "District Service Monitoring",
    heading: "Real-Time Monitoring of District\nGovernance Across Chhattisgarh",
    sub:     "Live dashboards for officers, analysts, and administrators to track service delivery performance.",
    image:   "/banners/banner 2.jpg",
  },
  {
    id: 3,
    label:   "Citizen Service Intelligence",
    heading: "Empowering Citizens Through\nIntelligent Public Administration",
    sub:     "AI-assisted beneficiary identification, grievance redressal, and scheme coverage for every eligible citizen.",
    image:   "/banners/banner 3.jpg",
  },
  {
    id: 4,
    label:   "Smart Governance Infrastructure",
    heading: "Building Data-Driven Administration\nfor the State of Chhattisgarh",
    sub:     "Integrated governance intelligence connecting citizens, departments and districts.",
    image:   "/banners/banner 4.png",
  },
];

const NOTICES = [
  { date: "03 Mar 2026", text: "NagarikAI Platform v2.0 deployed for district-level governance monitoring across all 5 districts of Chhattisgarh. All stakeholders are requested to update login credentials." },
  { date: "01 Mar 2026", text: "District Officers: Pending case statuses must be updated before 31st March 2026 to ensure accurate Q4 governance score computation." },
  { date: "27 Feb 2026", text: "CSC Operators: Biometric validation is now mandatory for all widow pension and disability scheme applications effective 1st April 2026." },
  { date: "25 Feb 2026", text: "Grievance redressal SLA compliance target revised upward to 87% for Q1 2026-27. Districts below 80% will be flagged for escalation." },
  { date: "20 Feb 2026", text: "New Beneficiary Identification Module is now live across Jagdalpur and Korba districts. Officers are advised to review auto-generated eligibility lists." },
  { date: "15 Feb 2026", text: "Department Analysts: Quarterly MIS reports for January-March 2026 must be submitted to the State Analytics Cell by 15th March 2026." },
];

const STATS = [
  { value: "5",     label: "Districts Covered",      color: "#138808" },
  { value: "40",    label: "Active Officers",         color: "#138808" },
  { value: "3,200+",label: "Grievances Processed",   color: "#0B3C5D" },
  { value: "600+",  label: "Citizens in Database",   color: "#0B3C5D" },
  { value: "5",     label: "Service Modules",        color: "#138808" },
  { value: "12",    label: "Schemes Monitored",      color: "#138808" },
];

const SERVICES = [
  { title: "Beneficiary Intelligence Engine", code: "BIE-01", icon: "🏛", desc: "AI-powered identification of eligible but unenrolled citizens for welfare schemes." },
  { title: "Grievance Administration Module", code: "GAM-02", icon: "📋", desc: "Automated classification, SLA tracking, and escalation of citizen grievances." },
  { title: "CSC Service Portal",              code: "CSC-03", icon: "🖥", desc: "Application validation, document verification and eligibility at service centres." },
  { title: "Governance Analytics Dashboard", code: "GAD-04", icon: "📊", desc: "District-level governance scores, forecast models and scheme leakage detection." },
  { title: "AI Knowledge Graph",             code: "KGS-05", icon: "🔗", desc: "Cross-reference citizen data, officers, departments and grievances for anomalies." },
];

/* ─── ASHOKA CHAKRA SPOKES (pre-computed to avoid Static Gen issues) ─── */
const CHAKRA_SPOKES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return {
    x1: 45 + 2 * Math.cos(angle), y1: 30 + 2 * Math.sin(angle),
    x2: 45 + 9 * Math.cos(angle), y2: 30 + 9 * Math.sin(angle),
  };
});

/* ─── INDIAN FLAG SVG ──────────────────────────────────────── */
function IndianFlag({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.667} viewBox="0 0 90 60" role="img" aria-label="Indian National Flag">
      <rect width="90" height="20" fill="#FF9933" />
      <rect y="20" width="90" height="20" fill="#FFFFFF" />
      <rect y="40" width="90" height="20" fill="#138808" />
      <circle cx="45" cy="30" r="9" fill="none" stroke="#000080" strokeWidth="1.5" />
      <circle cx="45" cy="30" r="1.5" fill="#000080" />
      {CHAKRA_SPOKES.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#000080" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      // Fade out, swap slide, fade in
      setVisible(false);
      setTimeout(() => {
        setSlide((s) => (s + 1) % SLIDES.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const cur = SLIDES[slide];

  const changeSlide = (i: number) => {
    setVisible(false);
    setTimeout(() => { setSlide(i); setVisible(true); }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans text-[#1a1a1a]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── TOP UTILITY BAR ─────────────────────────────────── */}
      <div className="bg-[#072c44] text-white text-[11px] px-4 md:px-10 py-1 flex items-center justify-between">
        <span className="hidden md:block">भारत सरकार / Government of India | राज्य सरकार छत्तीसगढ़ / Government of Chhattisgarh</span>
        <span className="block md:hidden">Govt. of Chhattisgarh</span>
        <div className="flex items-center gap-4 text-white/70">
          <span>Screen Reader</span><span>|</span><span>Skip to Content</span><span>|</span>
          <select className="bg-transparent text-white/80 text-[11px] border-none outline-none cursor-pointer">
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>

      {/* ── MAIN HEADER ─────────────────────────────────────── */}
      <header className="bg-white" style={{ borderBottom: "4px solid #FF9933" }}>
        <div className="px-4 md:px-10 py-4 flex items-center gap-4">
          {/* Left: Emblem + Title */}
          <div className="flex-shrink-0 w-16 h-16 border-2 border-[#0B3C5D] rounded-full flex items-center justify-center bg-[#eff5fb]">
            <span className="text-3xl">🏛</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#888] font-semibold uppercase tracking-widest">
              Department of Information Technology &amp; e-Governance
            </p>
            <h1 className="text-lg md:text-2xl font-bold text-[#0B3C5D] leading-tight">
              NagarikAI — Governance Intelligence Engine
            </h1>
            <p className="text-[12px] text-[#666]">
              Government of Chhattisgarh, Mantralaya, Raipur — 492001
            </p>
          </div>

          {/* Right: Large Indian Flag */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <IndianFlag size={90} />
            <p className="text-[10px] text-[#666] font-semibold tracking-widest uppercase text-center">
              Jai Hind
            </p>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="bg-[#0B3C5D]">
          <div className="px-4 md:px-10 flex items-center overflow-x-auto">
            {[
              { label: "Home",             href: "#home"       },
              { label: "About the Portal", href: "#about"      },
              { label: "Services",         href: "#services"   },
              { label: "MIS Reports",      href: "#mis"        },
              { label: "Grievances",       href: "#grievances" },
              { label: "Contact Us",       href: "#contact"    },
            ].map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-white text-[13px] font-semibold px-4 py-3 border-r border-white/20 hover:bg-[#FF9933] transition-colors whitespace-nowrap ${i === 0 ? "bg-[#FF9933]" : ""}`}>
                {item.label}
              </a>
            ))}
            <div className="ml-auto flex items-center">
              {/* Tricolor accent */}
              <div className="hidden md:flex flex-col h-12 justify-center mr-3">
                <div className="w-1 h-4 bg-[#FF9933]" />
                <div className="w-1 h-4 bg-white" />
                <div className="w-1 h-4 bg-[#138808]" />
              </div>
              <Link href="/login" className="bg-[#FF9933] text-white text-[12px] font-bold px-5 py-3 hover:bg-[#e68a28] transition-colors whitespace-nowrap">
                ▶ OFFICIAL LOGIN
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* ── NOTICE TICKER ───────────────────────────────────── */}
      <div className="bg-[#fff8e1] border-b-2 border-[#ffd54f] flex items-center gap-0">
        <span className="bg-[#0B3C5D] text-white text-[11px] font-bold px-4 py-2 uppercase tracking-widest whitespace-nowrap">
          📢 Notices
        </span>
        <div className="flex-1 overflow-hidden px-4 py-2">
          <ul className="flex gap-8 text-[13px] text-[#444] marquee-list overflow-hidden">
            {NOTICES.map((n, i) => (
              <li key={i} className="whitespace-nowrap">
                <span className="font-semibold text-[#0B3C5D] mr-2">[{n.date}]</span>
                {n.text.slice(0, 80)}…
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── HERO SLIDER ─────────────────────────────────────────── */}
      <section id="home"
        className="relative overflow-hidden"
        style={{
          minHeight: "420px",
          backgroundImage: `linear-gradient(rgba(11,60,93,0.78), rgba(11,60,93,0.78)), url('${cur.image}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.4s ease-in-out",
        }}
      >
        {/* Subtle texture overlay — very low opacity so image shows through */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 40px)" }} />

        {/* Tricolor left accent bar */}
        <div className="absolute left-0 inset-y-0 flex flex-col w-2">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Fade wrapper */}
        <div
          className="relative pl-6 pr-4 md:pl-16 md:pr-10 py-14 md:py-20 max-w-5xl"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease-in-out" }}
        >
          {/* Slide label badge */}
          <div className="inline-flex items-center gap-2 border border-white/30 bg-white/10 text-white text-[11px] font-bold px-3 py-1 uppercase tracking-widest mb-4">
            <span className="inline-block w-2 h-2 bg-[#FF9933] rounded-full" />
            {cur.label}
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-snug mb-4 whitespace-pre-line drop-shadow-md">
            {cur.heading}
          </h2>
          <p className="text-base text-white/85 max-w-2xl mb-8 leading-7 drop-shadow">{cur.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="bg-[#FF9933] text-white font-bold px-6 py-3 text-[13px] hover:bg-[#e68a28] transition-colors border border-[#d07a22]">
              Access Official Portal
            </Link>
            <a href="#services" className="bg-transparent border-2 border-white/50 text-white font-bold px-6 py-3 text-[13px] hover:bg-white/10 transition-colors">
              View Services
            </a>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-5 left-14 flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => changeSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-8 bg-[#FF9933]" : "w-3 bg-white/40"}`} />
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-5 right-10 text-white/50 text-[11px] font-bold">
          {slide + 1} / {SLIDES.length}
        </div>
      </section>

      {/* ── MIS STATISTICS BAR ──────────────────────────────── */}
      <section id="mis" className="bg-white border-y-2 border-[#cfd6e3]">
        <div className="px-4 md:px-10 py-1 bg-[#0B3C5D]">
          <span className="text-[11px] text-white/70 font-bold uppercase tracking-widest">
            Governance MIS — State-Level Overview
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 divide-x-2 divide-[#e0e7ef]">
          {STATS.map((st, i) => (
            <div key={i} className="py-5 px-4 text-center border-b-2 md:border-b-0" style={{ borderBottomColor: st.color }}>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: st.color }}>{st.value}</div>
              <div className="text-[11px] text-[#555] font-semibold uppercase tracking-wide mt-1">{st.label}</div>
              <div className="mt-2 h-0.5 w-8 mx-auto rounded" style={{ backgroundColor: st.color }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── ANNOUNCEMENTS + QUICK ACCESS ────────────────────── */}
      <section id="grievances" className="px-4 md:px-10 py-8 grid md:grid-cols-3 gap-6">
        {/* Official notice board */}
        <div className="md:col-span-2 border-2 border-[#cfd6e3] bg-white">
          {/* Header */}
          <div className="bg-[#0B3C5D] text-white flex items-center justify-between px-4 py-2.5">
            <span className="text-[12px] font-bold uppercase tracking-widest">📢 Latest Government Announcements</span>
            <span className="text-[11px] text-white/60">Updated: March 2026</span>
          </div>
          {/* Tricolor separator */}
          <div className="flex h-1"><div className="flex-1 bg-[#FF9933]"/><div className="flex-1 bg-white border-y border-[#eee]"/><div className="flex-1 bg-[#138808]"/></div>
          {/* Notices */}
          <ul className="divide-y divide-[#e8edf5]">
            {NOTICES.map((n, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#f8fbff] transition-colors">
                <div className="shrink-0 mt-0.5">
                  <span className="inline-block bg-[#0B3C5D] text-white text-[10px] font-bold px-2 py-0.5 uppercase">{n.date}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#333] leading-relaxed">{n.text}</p>
                </div>
                <span className="text-[#138808] text-lg shrink-0">▸</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#d8dee8] px-4 py-2 bg-[#f4f6f9]">
            <a href="#" className="text-[12px] text-[#0B3C5D] font-bold hover:underline">View All Notices ▶</a>
          </div>
        </div>

        {/* Quick Access Portal */}
        <div className="border-2 border-[#cfd6e3] bg-white">
          <div className="bg-[#0B3C5D] text-white px-4 py-2.5">
            <span className="text-[12px] font-bold uppercase tracking-widest">🔑 Quick Access Portal</span>
          </div>
          <div className="flex h-1"><div className="flex-1 bg-[#FF9933]"/><div className="flex-1 bg-white border-y border-[#eee]"/><div className="flex-1 bg-[#138808]"/></div>
          <div className="p-4 space-y-2.5">
            {[
              { label: "Authorized Login",           href: "/login",       icon: "🔐", bg: "#0B3C5D" },
              { label: "Admin & State Dashboard",    href: "/admin",       icon: "🏛", bg: "#13456b" },
              { label: "District Officer Dashboard", href: "/officer",     icon: "👮", bg: "#1a5276" },
              { label: "CSC Service Portal",         href: "/csc",         icon: "🖥", bg: "#145a32" },
              { label: "Department Analytics",       href: "/analyst",     icon: "📊", bg: "#4a235a" },
              { label: "Beneficiary Discovery",      href: "/beneficiary", icon: "👥", bg: "#784212" },
            ].map((b) => (
              <Link key={b.label} href={b.href}
                className="flex items-center gap-3 px-3 py-2.5 text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: b.bg }}>
                <span className="text-base">{b.icon}</span>
                <span className="flex-1">{b.label}</span>
                <span className="text-xs opacity-60">▶</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY SERVICES ────────────────────────────────────── */}
      <section id="services" className="bg-[#eef3f8] border-y-2 border-[#c7d2e0] py-10 px-4 md:px-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex flex-col w-1 h-8 gap-0">
            <div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-[#138808]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B3C5D] uppercase tracking-widest">Key Governance Services</h2>
            <p className="text-[12px] text-[#666] mt-0.5">Official modules available through the NagarikAI portal</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-0 border-2 border-[#c7d2e0]">
          {SERVICES.map((s, i) => (
            <div key={i} className={`bg-white border-r-2 border-[#c7d2e0] last:border-r-0 hover:bg-[#f0f6ff] transition-colors`}>
              <div className="bg-[#0B3C5D] text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest flex justify-between">
                <span>Module</span><span className="opacity-60">{s.code}</span>
              </div>
              <div className="h-0.5 bg-[#138808]" />
              <div className="p-4">
                <div className="text-3xl mb-3 text-center">{s.icon}</div>
                <h3 className="text-[12px] font-bold text-[#0B3C5D] mb-2 leading-snug text-center">{s.title}</h3>
                <p className="text-[11px] text-[#555] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATE GOVERNANCE OVERVIEW ────────────────────────── */}
      <section id="about" className="py-10 px-4 md:px-10 bg-white border-b-2 border-[#d0d7e3]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex flex-col w-1 h-8 gap-0">
            <div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-[#138808]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B3C5D] uppercase tracking-widest">State Governance Overview</h2>
            <p className="text-[12px] text-[#666] mt-0.5">District coverage and monitoring status — Chhattisgarh</p>
          </div>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          {["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"].map((d) => (
            <div key={d} className="border-2 border-[#cfd6e3] bg-[#f8fbff]">
              <div className="bg-[#0B3C5D] text-white text-[11px] font-bold px-3 py-1.5 uppercase tracking-widest">{d}</div>
              <div className="h-1 bg-[#138808]" />
              <div className="p-3 space-y-1.5 text-[12px] text-[#444]">
                <div className="flex justify-between"><span>Status</span><span className="font-bold text-[#138808]">✔ Active</span></div>
                <div className="flex justify-between"><span>Officers</span><span className="font-bold text-[#0B3C5D]">8</span></div>
                <div className="flex justify-between"><span>Monitoring</span><span className="font-bold text-[#138808]">Live</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT DEPARTMENT ────────────────────────────────── */}
      <section className="py-10 px-4 md:px-10 bg-[#f4f6f9] border-b-2 border-[#d0d7e3]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex flex-col w-1 h-8 gap-0">
            <div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-[#138808]" />
          </div>
          <h2 className="text-lg font-bold text-[#0B3C5D] uppercase tracking-widest">About the Department</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 ml-5">
          <div>
            <h3 className="text-[14px] font-bold text-[#0B3C5D] mb-2 border-b border-[#cfd6e3] pb-1">About NagarikAI Portal</h3>
            <p className="text-[13px] text-[#444] leading-7">The NagarikAI portal is an official initiative of the Department of IT &amp; e-Governance, Government of Chhattisgarh. It provides districts, departments, and CSC operators with AI-driven tools for citizen service management, grievance redressal, and governance monitoring.</p>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#0B3C5D] mb-2 border-b border-[#cfd6e3] pb-1">Mission Statement</h3>
            <p className="text-[13px] text-[#444] leading-7">To establish a transparent, accountable, and technology-enabled governance framework that ensures timely public service delivery, reduces scheme leakage, and enables data-driven policy decisions across all administrative tiers of the state.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#0B3C5D] text-white">
        {/* Tricolor top stripe */}
        <div className="flex h-1.5"><div className="flex-1 bg-[#FF9933]"/><div className="flex-1 bg-white"/><div className="flex-1 bg-[#138808]"/></div>

        <div className="px-4 md:px-10 py-8 grid md:grid-cols-4 gap-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <IndianFlag size={36} />
              <h4 className="text-[11px] uppercase tracking-widest font-bold text-white/60">Official Portal</h4>
            </div>
            <p className="text-[13px] text-white/80 leading-6">NagarikAI Governance Intelligence Engine<br />Dept. of IT &amp; e-Governance<br />Government of Chhattisgarh</p>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-white/60 mb-3">Contact Details</h4>
            <p className="text-[13px] text-white/80 leading-7">Mantralaya, Raipur — 492001<br />Chhattisgarh, India<br />Helpline: 1800-XXX-XXXX<br />Email: support@nagarikai.cg.gov.in</p>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-white/60 mb-3">Portal Links</h4>
            <ul className="space-y-1.5 text-[13px]">
              {["Home", "Services", "Login", "Grievances", "CSC Portal", "Analyst Dashboard"].map(l => (
                <li key={l}><a href="#" className="text-white/70 hover:text-[#FF9933] transition-colors">▸ {l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-white/60 mb-3">Official Disclaimer</h4>
            <p className="text-[12px] text-white/60 leading-6">This portal is the official property of the Government of Chhattisgarh. Unauthorized access is prohibited under the IT Act, 2000. Content is intended solely for authorized administrative personnel.</p>
            <ul className="mt-3 space-y-1 text-[12px]">
              {["Terms of Use", "Privacy Policy", "Accessibility"].map(l => (
                <li key={l}><a href="#" className="text-white/50 hover:text-white">▸ {l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-4 md:px-10 py-3 flex flex-col md:flex-row justify-between items-center text-[11px] text-white/50 gap-2">
          <span>© 2026 Government of Chhattisgarh. All Rights Reserved. Content owned by Department of IT &amp; e-Governance.</span>
          <span>System Version 2.0.0 · NIC Hosted · Last Updated: March 2026</span>
        </div>

        {/* Tricolor bottom stripe */}
        <div className="flex h-1.5"><div className="flex-1 bg-[#FF9933]"/><div className="flex-1 bg-white"/><div className="flex-1 bg-[#138808]"/></div>
      </footer>
    </div>
  );
}
