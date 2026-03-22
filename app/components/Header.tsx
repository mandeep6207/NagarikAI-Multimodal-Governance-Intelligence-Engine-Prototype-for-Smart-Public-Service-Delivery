import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-slate-800">
        Governance Intelligence Dashboard
      </h2>
      <div className="flex items-center space-x-4 text-slate-500">
        <button className="hover:text-slate-700">
          <Search size={20} />
        </button>
        <button className="hover:text-slate-700 relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold ml-4">
          SA
        </div>
      </div>
    </header>
  );
}
