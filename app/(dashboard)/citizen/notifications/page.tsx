"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Bell, CheckCircle2, AlertTriangle, Info, FileCheck,
  MessageSquare, ShieldAlert, Clock, Check,
} from "lucide-react";
import { toast } from "sonner";

export default function CitizenNotificationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread | read

  const fetchNotif = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchCitizenNotifications();
      setNotifications(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotif(); }, [fetchNotif]);

  const markRead = async (id: string) => {
    try {
      await api.markCitizenNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      toast.success("Marked as read");
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      await Promise.all(unreadIds.map(id => api.markCitizenNotificationRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (e) { console.error(e); }
  };

  const filtered = filter === "all" ? notifications :
    filter === "unread" ? notifications.filter(n => !n.read) :
    notifications.filter(n => n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcon = (type: string) => {
    const map: Record<string, typeof Bell> = {
      complaint_resolved: CheckCircle2,
      application_approved: CheckCircle2,
      application_rejected: AlertTriangle,
      documents_required: FileCheck,
      complaint_update: MessageSquare,
      scheme_update: Info,
      fraud_alert: ShieldAlert,
      reminder: Clock,
    };
    const Icon = map[type] || Bell;
    return <Icon size={16} />;
  };

  const typeColor = (type: string) => {
    const map: Record<string, string> = {
      complaint_resolved: "text-green-600 bg-green-100",
      application_approved: "text-green-600 bg-green-100",
      application_rejected: "text-red-600 bg-red-100",
      documents_required: "text-blue-600 bg-blue-100",
      complaint_update: "text-indigo-600 bg-indigo-100",
      scheme_update: "text-purple-600 bg-purple-100",
      fraud_alert: "text-red-600 bg-red-100",
      reminder: "text-amber-600 bg-amber-100",
    };
    return map[type] || "text-slate-600 bg-slate-100";
  };

  const severityBadge = (sev: string) => {
    const map: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-amber-100 text-amber-800",
      low: "bg-green-100 text-green-800",
    };
    return map[sev] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] flex items-center gap-2">
            <Bell size={22} /> Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#0B3C5D]/30"
          >
            <option value="all">All ({notifications.length})</option>
            <option value="unread">Unread ({unreadCount})</option>
            <option value="read">Read ({notifications.length - unreadCount})</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="bg-[#0B3C5D] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0a3350] flex items-center gap-1"
            >
              <Check size={12} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
            <Bell size={40} className="opacity-20" />
            No notifications
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${
                notif.read ? "border-slate-200" : "border-[#0B3C5D]/30 ring-1 ring-[#0B3C5D]/10"
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Type Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColor(notif.type)}`}>
                  {typeIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className={`text-sm ${notif.read ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${severityBadge(notif.severity)}`}>
                        {notif.severity}
                      </span>
                      {!notif.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0B3C5D]" title="Unread" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {notif.type?.replace(/_/g, " ")}
                      </span>
                      <span>{notif.created_at ? new Date(notif.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</span>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => markRead(notif.id)}
                        className="text-[#0B3C5D] text-xs font-semibold hover:underline flex items-center gap-1"
                      >
                        <Check size={12} /> Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
