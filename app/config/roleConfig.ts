/**
 * roleConfig.ts — Single source of truth for all RBAC navigation.
 *
 * To update permissions for any role, edit ONLY this file.
 * The Sidebar, route guard (layout), and login redirect all read from here.
 */
import {
  LayoutDashboard,
  Users,
  BarChart3,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Map,
  Video,
  UserCog,
  FileWarning,
  Brain,
  Landmark,
  Inbox,
  ClipboardList,
  FileUp,
  FilePlus2,
  ShieldAlert,
  Mic,
  Bell,
  FileSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type RoleConfig = {
  /** Display label in topbar / sidebar header */
  label: string;
  /** Where to land after login */
  homePath: string;
  /** Sidebar navigation items — only shown for this role */
  nav: NavItem[];
  /**
   * Route prefixes this role is permitted to visit.
   * Derived automatically from nav hrefs; kept explicit here for clarity.
   */
  allowedPrefixes: string[];
};

export const ROLE_CONFIG: Record<string, RoleConfig> = {
  super_admin: {
    label: "Super Administrator",
    homePath: "/admin",
    nav: [
      { name: "State Dashboard",         href: "/admin",                 icon: LayoutDashboard },
      { name: "District Intelligence",   href: "/admin/districts",       icon: Map },
      { name: "Grievance Intelligence",  href: "/admin/grievances",      icon: AlertCircle },
      { name: "Video Complaints",        href: "/admin/video-complaints",icon: Video },
      { name: "Officer Management",      href: "/admin/officers",        icon: UserCog },
      { name: "Scheme Intelligence",     href: "/admin/schemes",         icon: Landmark },
      { name: "Fraud Detection",         href: "/admin/fraud",           icon: FileWarning },
      { name: "AI Insights",             href: "/admin/ai-insights",     icon: Brain },
    ],
    allowedPrefixes: ["/admin", "/settings"],
  },

  district_officer: {
    label: "District Officer",
    homePath: "/officer",
    nav: [
      { name: "Operations Dashboard",    href: "/officer",                    icon: LayoutDashboard },
      { name: "Complaint Inbox",          href: "/officer/complaints",         icon: Inbox },
      { name: "Video Complaints",         href: "/officer/video-complaints",   icon: Video },
      { name: "Field Officers",           href: "/officer/field-officers",     icon: Users },
      { name: "Scheme Review",            href: "/officer/scheme-review",      icon: ClipboardList },
      { name: "Performance Analytics",    href: "/officer/analytics",          icon: BarChart3 },
    ],
    allowedPrefixes: ["/officer", "/settings"],
  },

  csc_operator: {
    label: "CSC Operator",
    homePath: "/csc",
    nav: [
      { name: "CSC Dashboard",           href: "/csc",                     icon: LayoutDashboard },
      { name: "New Complaint",            href: "/csc/new-complaint",       icon: FilePlus2 },
      { name: "Video Complaint",          href: "/csc/video-complaint",     icon: Video },
      { name: "Document Upload",          href: "/csc/documents",           icon: FileUp },
      { name: "Scheme Applications",      href: "/csc/schemes",             icon: Landmark },
      { name: "Fraud Detection",          href: "/csc/fraud-detection",     icon: ShieldAlert },
    ],
    allowedPrefixes: ["/csc", "/settings"],
  },

  analyst: {
    label: "Department Analyst",
    homePath: "/analyst",
    nav: [
      { name: "Analytics Dashboard",    href: "/analyst",     icon: LayoutDashboard },
      { name: "Knowledge Graph",        href: "/analyst",     icon: TrendingUp },
      { name: "Forecast Models",        href: "/analyst",     icon: BarChart3 },
      { name: "Beneficiary Reports",    href: "/beneficiary", icon: Briefcase },
    ],
    allowedPrefixes: ["/analyst", "/beneficiary", "/settings"],
  },

  citizen: {
    label: "Citizen Portal",
    homePath: "/citizen",
    nav: [
      { name: "My Dashboard",          href: "/citizen",                  icon: LayoutDashboard },
      { name: "Submit Complaint",       href: "/citizen/complaints",       icon: FilePlus2 },
      { name: "Voice Complaint",        href: "/citizen/voice-complaint",  icon: Mic },
      { name: "Video Complaint",        href: "/citizen/video-complaint",  icon: Video },
      { name: "Scheme Applications",    href: "/citizen/schemes",          icon: Landmark },
      { name: "Document Upload",        href: "/citizen/documents",        icon: FileUp },
      { name: "Application Status",     href: "/citizen/applications",     icon: FileSearch },
      { name: "Notifications",          href: "/citizen/notifications",    icon: Bell },
    ],
    allowedPrefixes: ["/citizen", "/settings"],
  },
};

/** Returns `true` if the given path is accessible for the given role. */
export function isRouteAllowed(role: string, pathname: string): boolean {
  const config = ROLE_CONFIG[role];
  if (!config) return false;
  return config.allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Returns the home path for a given role (fallback: /login). */
export function getRoleHome(role: string): string {
  return ROLE_CONFIG[role]?.homePath ?? "/login";
}
